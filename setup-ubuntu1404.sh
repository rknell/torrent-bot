#!/bin/bash

curl -sL https://deb.nodesource.com/setup | sudo bash -
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
echo "deb http://repo.mongodb.org/apt/ubuntu "$(lsb_release -sc)"/mongodb-org/3.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.0.list
sudo add-apt-repository ppa:jon-severinsson/ffmpeg
sudo apt-get update
sudo apt-get install nodejs build-essential ffmpeg git
sudo apt-get install -y mongodb-org
sudo service mongod start
sudo npm install -g forever
git clone https://github.com/rknell/torrent-bot.git
cd torrent-bot
npm install

echo "Setup should be complete"