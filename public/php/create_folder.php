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
if (!is_dir($targetDir)) {
    mkdir($targetDir, 0777, true);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    if (!isset($data['name']) || empty($data['name'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Název složky je povinný.']);
        exit;
    }
    
    $currentPath = isset($data['path']) ? $data['path'] : '';
    $currentPath = trim($currentPath, '/');
    
    // Bezpečnostní kontrola
    $currentPath = str_replace(['..', '\\'], ['', '/'], $currentPath);
    
    $folderName = $data['name'];
    
    // Očistit název složky
    $folderName = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $folderName);
    $folderName = str_replace(' ', '-', $folderName);
    $folderName = preg_replace('/[^a-zA-Z0-9\-_]/', '', $folderName);
    $folderName = strtolower($folderName);
    $folderName = preg_replace('/-+/', '-', $folderName);
    $folderName = trim($folderName, '-_');
    
    if (empty($folderName)) {
        http_response_code(400);
        echo json_encode(['error' => 'Neplatný název složky.']);
        exit;
    }
    
    $newFolderPath = $targetDir . ($currentPath ? $currentPath . '/' : '') . $folderName;
    
    if (is_dir($newFolderPath)) {
        http_response_code(400);
        echo json_encode(['error' => 'Složka již existuje.']);
        exit;
    }
    
    if (mkdir($newFolderPath, 0777, true)) {
        echo json_encode([
            'success' => true,
            'folder' => $folderName,
            'path' => ($currentPath ? $currentPath . '/' : '') . $folderName
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Chyba při vytváření složky.']);
    }
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Neplatná metoda.']);
}
?>
