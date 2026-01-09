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

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['assetfile'])) {
    $file = $_FILES['assetfile'];
    $originalFileName = basename($file['name']);
    
    // Získat příponu
    $fileExtension = strtolower(pathinfo($originalFileName, PATHINFO_EXTENSION));
    $fileNameWithoutExt = pathinfo($originalFileName, PATHINFO_FILENAME);
    
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
    $fileName = $fileNameWithoutExt . '.' . $fileExtension;
    $targetFile = $targetDir . $fileName;
    
    // Pokud soubor existuje, přidat timestamp
    if (file_exists($targetFile)) {
        $fileName = $fileNameWithoutExt . '-' . time() . '.' . $fileExtension;
        $targetFile = $targetDir . $fileName;
    }

    // Bezpečnostní kontrola - povolené přípony
    $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'pdf', 'mp4', 'webm', 'mp3', 'wav', 'zip'];
    $fileExtension = strtolower(pathinfo($targetFile, PATHINFO_EXTENSION));
    
    if (!in_array($fileExtension, $allowedExtensions)) {
        http_response_code(400);
        echo json_encode(['error' => 'Nepodporovaný typ souboru.']);
        exit;
    }

    // Kontrola velikosti (max 100MB)
    if ($file['size'] > 100 * 1024 * 1024) {
        http_response_code(400);
        echo json_encode(['error' => 'Soubor je příliš velký (max 100MB).']);
        exit;
    }

    if (move_uploaded_file($file['tmp_name'], $targetFile)) {
        echo json_encode([
            'success' => true,
            'filename' => $fileName,
            'path' => '/assets/' . $fileName
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Chyba při nahrávání souboru.']);
    }
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Nahrávání selhalo.']);
}
?>
