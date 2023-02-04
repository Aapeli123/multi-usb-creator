#!/bin/bash
echo Downloading newest version of the exam system
wget https://static.abitti.fi/etcher-usb/koe-etcher.zip
echo Unzipping the file and moving it to the images dir
unzip koe-etcher.zip
mkdir -p ./images
cp -f ./ytl/koe.img ./images/ 
echo cleaning up...
rm -rf ytl
rm koe-etcher.zip
