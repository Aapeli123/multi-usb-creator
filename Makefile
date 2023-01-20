build: .backend .ui 

.ui:
	cd ./ui; yarn install; yarn build-container; 

.backend:
	chmod +x ./build.sh
	./build.sh

start: # build
	cd ./ui; yarn start
	sudo ./usb-stick-writer

restart: stop start

stop:
	cd ./ui; yarn stop

.install-deps:
	sudo apt install docker.io unzip wget -y
	chmod +x ./scripts/install-yarn.sh
	./scripts/install-yarn.sh

.install-img:
	./download-img.sh

install: .install-deps build .install-img start