# FBC Back-end

## Synopsis
This repo is about a back-end standardized for an instant messaging front-end for a development project in the Front-end & Back-end Coordination course at Ynov Aix-en-Provence.

## Installation
1. Install NodeJS and NPM
   - Linux

    ```
    curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```

   - Windows
  
     Download and execute the installer from the official website [Nodejs.org](https://nodejs.org/en/)
     
2. Install MongoDB

   Follow the steps depending on your OS at the [MongoDB official docs](https://docs.mongodb.com/manual/administration/install-community/).

3. Clone this repository

   ```
   git clone git@github.com:Meknassih/back-cfb.git
   ```

4. Install NPM dependencies

   ```
   cd back-fcb
   npm install
   ```

## Usage

Start the server with :
```
npm run serve
```

## Note

JWT secret key to decrypt the signature is by default the string `toto`.
You can change at line 17 in src/app.js.