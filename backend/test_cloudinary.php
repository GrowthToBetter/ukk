<?php
require 'vendor/autoload.php';
if (class_exists('Cloudinary\Cloudinary')) {
    echo "Exists";
} else {
    echo "Not Found";
}
