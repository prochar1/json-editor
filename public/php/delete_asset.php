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

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    if (!isset($data['path']) || empty($data['path'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Cesta k souboru je povinná.']);
        exit;
    }
    
    $filePath = $data['path'];
    
    // Odstranit /assets/ prefix pokud existuje
    $filePath = preg_replace('#^/assets/#', '', $filePath);
    
    // Bezpečnostní kontrola - zabránit directory traversal
    $filePath = str_replace(['..', '\\'], ['', '/'], $filePath);
    
    $fullPath = $targetDir . $filePath;
    
    if (!file_exists($fullPath)) {
        http_response_code(404);
        echo json_encode(['error' => 'Soubor neexistuje.']);
        exit;
    }
    
    if (!is_file($fullPath)) {
        http_response_code(400);
        echo json_encode(['error' => 'Zadaná cesta není soubor.']);
        exit;
    }
    
    if (unlink($fullPath)) {
        // Smazat i thumbnail, pokud existuje
        $thumbnailPath = dirname($fullPath) . '/_thumb_' . basename($fullPath);
        if (file_exists($thumbnailPath)) {
            unlink($thumbnailPath);
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Soubor byl smazán.'
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Chyba při mazání souboru.']);
    }
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Neplatná metoda.']);
}
?>
