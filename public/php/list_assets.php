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
header('Access-Control-Allow-Methods: GET, OPTIONS');
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

$files = [];
$items = scandir($targetDir);

foreach ($items as $item) {
    if ($item === '.' || $item === '..') continue;
    
    $filePath = $targetDir . $item;
    if (is_file($filePath)) {
        $files[] = [
            'name' => $item,
            'path' => '/assets/' . $item,
            'size' => filesize($filePath),
            'modified' => filemtime($filePath),
            'type' => mime_content_type($filePath)
        ];
    }
}

// Seřadit podle data úpravy (nejnovější první)
usort($files, function($a, $b) {
    return $b['modified'] - $a['modified'];
});

echo json_encode(['files' => $files]);
?>
