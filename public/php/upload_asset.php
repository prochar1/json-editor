<?php
// Dynamické CORS povolení pro více domén
if (isset($_SERVER['HTTP_ORIGIN'])) {
    $allowed_origins = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        // Přidej další domény pro produkci
    ];
    if (in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
        header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
        header('Vary: Origin');
    }
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$targetDir = __DIR__ . '/../assets/';
if (!is_dir($targetDir)) {
    mkdir($targetDir, 0777, true);
}

// Získat aktuální cestu z parametru (kam se má nahrát)
$currentPath = isset($_POST['path']) ? $_POST['path'] : '';
$currentPath = trim($currentPath, '/');

// Bezpečnostní kontrola - zabránit directory traversal
$currentPath = str_replace(['..', '\\'], ['', '/'], $currentPath);

$uploadDir = $targetDir . ($currentPath ? $currentPath . '/' : '');
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

// Funkce pro vytvoření náhledu
function createThumbnail($sourcePath, $thumbnailPath, $maxWidth = 200, $maxHeight = 200) {
    $imageInfo = getimagesize($sourcePath);
    if (!$imageInfo) return false;
    
    $sourceWidth = $imageInfo[0];
    $sourceHeight = $imageInfo[1];
    $mimeType = $imageInfo['mime'];
    
    // Načíst obrázek podle typu
    switch ($mimeType) {
        case 'image/jpeg':
            $sourceImage = imagecreatefromjpeg($sourcePath);
            break;
        case 'image/png':
            $sourceImage = imagecreatefrompng($sourcePath);
            break;
        case 'image/gif':
            $sourceImage = imagecreatefromgif($sourcePath);
            break;
        case 'image/webp':
            $sourceImage = imagecreatefromwebp($sourcePath);
            break;
        default:
            return false;
    }
    
    if (!$sourceImage) return false;
    
    // Vypočítat nové rozměry se zachováním poměru stran
    $ratio = min($maxWidth / $sourceWidth, $maxHeight / $sourceHeight);
    $newWidth = (int)($sourceWidth * $ratio);
    $newHeight = (int)($sourceHeight * $ratio);
    
    // Vytvořit náhled
    $thumbnail = imagecreatetruecolor($newWidth, $newHeight);
    
    // Zachovat průhlednost pro PNG a GIF
    if ($mimeType === 'image/png' || $mimeType === 'image/gif') {
        imagealphablending($thumbnail, false);
        imagesavealpha($thumbnail, true);
        $transparent = imagecolorallocatealpha($thumbnail, 0, 0, 0, 127);
        imagefill($thumbnail, 0, 0, $transparent);
    }
    
    imagecopyresampled($thumbnail, $sourceImage, 0, 0, 0, 0, $newWidth, $newHeight, $sourceWidth, $sourceHeight);
    
    // Uložit náhled jako JPEG (nebo PNG pro průhlednost)
    $thumbnailDir = dirname($thumbnailPath);
    if (!is_dir($thumbnailDir)) {
        mkdir($thumbnailDir, 0777, true);
    }
    
    if ($mimeType === 'image/png') {
        imagepng($thumbnail, $thumbnailPath, 8);
    } else {
        imagejpeg($thumbnail, $thumbnailPath, 85);
    }
    
    imagedestroy($sourceImage);
    imagedestroy($thumbnail);
    
    return true;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['assetfile'])) {
    $files = $_FILES['assetfile'];
    $uploadedFiles = [];
    $errors = [];
    
    // Zpracovat jeden nebo více souborů
    $fileCount = is_array($files['name']) ? count($files['name']) : 1;
    
    for ($i = 0; $i < $fileCount; $i++) {
        // Získat data souboru (podporuje single i multiple upload)
        $fileName = is_array($files['name']) ? $files['name'][$i] : $files['name'];
        $fileTmpName = is_array($files['tmp_name']) ? $files['tmp_name'][$i] : $files['tmp_name'];
        $fileSize = is_array($files['size']) ? $files['size'][$i] : $files['size'];
        $fileError = is_array($files['error']) ? $files['error'][$i] : $files['error'];
        
        if ($fileError !== UPLOAD_ERR_OK) {
            $errors[] = "Chyba při nahrávání souboru $fileName";
            continue;
        }
        
        $originalFileName = basename($fileName);
        
        // Získat příponu
        $fileExtension = strtolower(pathinfo($originalFileName, PATHINFO_EXTENSION));
        $fileNameWithoutExt = pathinfo($originalFileName, PATHINFO_FILENAME);
        
        // Bezpečnostní kontrola - povolené přípony
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'pdf', 'mp4', 'webm', 'mp3', 'wav', 'zip'];
        
        if (!in_array($fileExtension, $allowedExtensions)) {
            $errors[] = "Nepodporovaný typ souboru: $originalFileName";
            continue;
        }
        
        // Kontrola velikosti (max 100MB)
        if ($fileSize > 100 * 1024 * 1024) {
            $errors[] = "Soubor $originalFileName je příliš velký (max 100MB)";
            continue;
        }
        
        // Odstranit diakritiku
        $fileNameWithoutExt = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $fileNameWithoutExt);
        
        // Nahradit mezery pomlčkami
        $fileNameWithoutExt = str_replace(' ', '-', $fileNameWithoutExt);
        
        // Odstranit všechny znaky kromě písmen, číslic, pomlček a podtržítek
        $fileNameWithoutExt = preg_replace('/[^a-zA-Z0-9\-_]/', '', $fileNameWithoutExt);
        
        // Převést na malá písmena
        $fileNameWithoutExt = strtolower($fileNameWithoutExt);
        
        // Odstranit duplicitní pomlčky
        $fileNameWithoutExt = preg_replace('/-+/', '-', $fileNameWithoutExt);
        
        // Odstranit pomlčky na začátku a konci
        $fileNameWithoutExt = trim($fileNameWithoutExt, '-_');
        
        // Pokud je název prázdný, použít timestamp
        if (empty($fileNameWithoutExt)) {
            $fileNameWithoutExt = 'file-' . time();
        }
        
        // Sestavit finální název souboru
        $cleanFileName = $fileNameWithoutExt . '.' . $fileExtension;
        $targetFile = $uploadDir . $cleanFileName;
        
        // Pokud soubor existuje, přidat timestamp
        if (file_exists($targetFile)) {
            $cleanFileName = $fileNameWithoutExt . '-' . time() . '-' . $i . '.' . $fileExtension;
            $targetFile = $uploadDir . $cleanFileName;
        }
        
        if (move_uploaded_file($fileTmpName, $targetFile)) {
            $thumbnailPath = null;
            
            // Vytvořit náhled pro obrázky
            $imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
            if (in_array($fileExtension, $imageExtensions)) {
                // Uložit thumbnail vedle originálního souboru s prefixem thumb_
                $thumbnailFileName = '_thumb_' . $cleanFileName;
                $thumbnailFullPath = $uploadDir . $thumbnailFileName;
                
                if (createThumbnail($targetFile, $thumbnailFullPath)) {
                    $thumbnailPath = '/assets/' . ($currentPath ? $currentPath . '/' : '') . $thumbnailFileName;
                }
            }
            
            $uploadedFiles[] = [
                'filename' => $cleanFileName,
                'path' => '/assets/' . ($currentPath ? $currentPath . '/' : '') . $cleanFileName,
                'thumbnail' => $thumbnailPath,
                'original' => $originalFileName
            ];
        } else {
            $errors[] = "Chyba při ukládání souboru $originalFileName";
        }
    }
    
    if (count($uploadedFiles) > 0) {
        echo json_encode([
            'success' => true,
            'files' => $uploadedFiles,
            'errors' => $errors
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Žádný soubor nebyl nahrán', 'errors' => $errors]);
    }
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Nahrávání selhalo.']);
}
?>
