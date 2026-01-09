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
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$targetDir = __DIR__ . '/../assets/';
$tempDir = __DIR__ . '/../assets/.upload_chunks/';

if (!is_dir($targetDir)) {
    mkdir($targetDir, 0777, true);
}
if (!is_dir($tempDir)) {
    mkdir($tempDir, 0777, true);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $chunkIndex = isset($_POST['chunkIndex']) ? (int)$_POST['chunkIndex'] : 0;
    $totalChunks = isset($_POST['totalChunks']) ? (int)$_POST['totalChunks'] : 1;
    $fileName = isset($_POST['fileName']) ? $_POST['fileName'] : '';
    $fileId = isset($_POST['fileId']) ? $_POST['fileId'] : '';
    $currentPath = isset($_POST['path']) ? $_POST['path'] : '';
    
    if (empty($fileName) || empty($fileId)) {
        http_response_code(400);
        echo json_encode(['error' => 'Chybí název souboru nebo ID.']);
        exit;
    }
    
    // Bezpečnostní kontrola cesty
    $currentPath = trim($currentPath, '/');
    $currentPath = str_replace(['..', '\\'], ['', '/'], $currentPath);
    
    // Sanitizace názvu souboru
    $fileName = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $fileName);
    $fileName = preg_replace('/[^a-zA-Z0-9\-_\.]/', '', strtolower($fileName));
    $fileName = preg_replace('/\.+/', '.', $fileName);
    
    // Dočasný soubor pro tento chunk
    $chunkFile = $tempDir . $fileId . '_' . $chunkIndex;
    
    if (!isset($_FILES['chunk'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Nebyl nahrán žádný chunk.']);
        exit;
    }
    
    $chunk = $_FILES['chunk'];
    
    if ($chunk['error'] !== UPLOAD_ERR_OK) {
        http_response_code(500);
        echo json_encode(['error' => 'Chyba při nahrávání chunku: ' . $chunk['error']]);
        exit;
    }
    
    // Uložit chunk
    if (!move_uploaded_file($chunk['tmp_name'], $chunkFile)) {
        http_response_code(500);
        echo json_encode(['error' => 'Chyba při ukládání chunku.']);
        exit;
    }
    
    // Pokud je to poslední chunk, poskládat soubor dohromady
    if ($chunkIndex === $totalChunks - 1) {
        $uploadDir = $targetDir . ($currentPath ? $currentPath . '/' : '');
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        
        // Ověřit, že máme všechny chunky
        $allChunksPresent = true;
        for ($i = 0; $i < $totalChunks; $i++) {
            if (!file_exists($tempDir . $fileId . '_' . $i)) {
                $allChunksPresent = false;
                break;
            }
        }
        
        if (!$allChunksPresent) {
            http_response_code(400);
            echo json_encode(['error' => 'Některé části souboru chybí.']);
            exit;
        }
        
        // Kontrola, zda soubor již existuje, přidat timestamp pokud ano
        $finalFileName = $fileName;
        $targetFile = $uploadDir . $finalFileName;
        $counter = 1;
        while (file_exists($targetFile)) {
            $pathInfo = pathinfo($fileName);
            $finalFileName = $pathInfo['filename'] . '_' . time() . '_' . $counter . '.' . $pathInfo['extension'];
            $targetFile = $uploadDir . $finalFileName;
            $counter++;
        }
        
        // Poskládat chunky dohromady
        $finalFile = fopen($targetFile, 'wb');
        if (!$finalFile) {
            http_response_code(500);
            echo json_encode(['error' => 'Nelze vytvořit cílový soubor.']);
            exit;
        }
        
        for ($i = 0; $i < $totalChunks; $i++) {
            $chunkPath = $tempDir . $fileId . '_' . $i;
            $chunkData = fopen($chunkPath, 'rb');
            if ($chunkData) {
                while (!feof($chunkData)) {
                    fwrite($finalFile, fread($chunkData, 8192));
                }
                fclose($chunkData);
                unlink($chunkPath); // Smazat dočasný chunk
            }
        }
        
        fclose($finalFile);
        
        // Vytvořit thumbnail pro obrázky
        $thumbnailPath = null;
        $fileExtension = strtolower(pathinfo($finalFileName, PATHINFO_EXTENSION));
        $imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        
        if (in_array($fileExtension, $imageExtensions)) {
            require_once __DIR__ . '/create_thumbnail.php';
            $thumbnailFileName = 'thumb_' . $finalFileName;
            $thumbnailFullPath = $uploadDir . $thumbnailFileName;
            
            if (createThumbnail($targetFile, $thumbnailFullPath)) {
                $thumbnailPath = '/assets/' . ($currentPath ? $currentPath . '/' : '') . $thumbnailFileName;
            }
        }
        
        echo json_encode([
            'success' => true,
            'complete' => true,
            'file' => [
                'filename' => $finalFileName,
                'path' => '/assets/' . ($currentPath ? $currentPath . '/' : '') . $finalFileName,
                'thumbnail' => $thumbnailPath,
                'size' => filesize($targetFile)
            ]
        ]);
    } else {
        // Chunk byl úspěšně nahrán, ale ještě nejsme hotovi
        echo json_encode([
            'success' => true,
            'complete' => false,
            'chunkIndex' => $chunkIndex
        ]);
    }
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Neplatná metoda.']);
}
?>
