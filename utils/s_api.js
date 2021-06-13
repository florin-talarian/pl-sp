const fs = require('fs').promises;
const faker = require('faker');
const readline = require('readline');
const {google} = require('googleapisNew');
const GoogleOAuth2Client = google.auth.OAuth2;

const { GoogleSpreadsheet } = require('google-spreadsheet');

const { 
    v1: uuidv1,
    v4: uuidv4,
} = require('uuid');



class Spreadsheet {
    constructor(userEmail) {
        this.userEmail = userEmail;
        console.log("Spreadsheet, userEmail: ",this.userEmail);
        this.tokenPath = this.userEmail + '-token.json';
        this.credentialsPath = this.userEmail + '.credentials.json';

        this.initDone = false;
        this.doc = false;
        this.date = false;
        this.isoDate = false;
        this.uuid = false;
        this.doc = false;
        this.currentSheet = false;
        this.driver = false;
        this.auth = false;
        this.spreadsheetId = false;
    }

    init = async ()=>{
        if (!this.initDone){    
            this.initDone = true;
            this.date = new Date();
            this.isoDate = this.date.toISOString()
            this.uuid = uuidv4()
            let creds = await this.loadSecretFromLocalFile();
            if (creds){
                let parsed_creds = JSON.parse(creds)
                let auth = await this.authorize(parsed_creds)
                this.auth = auth;
                this.driver = google.drive({version: 'v3', auth});
            }
        }
    }

    loadSpreadsheet = async (spreadsheetId)=>{
        const doc = new GoogleSpreadsheet(spreadsheetId);
        await doc.useOAuth2Client(this.auth)
        await doc.loadInfo()
        console.log("Done loadSpreadsheet");
        return doc
    }

    createSpreadsheetDoc = async ()=>{
        if (this.auth){
            const doc = new GoogleSpreadsheet();
            await doc.useOAuth2Client(this.auth)
            this.spreadsheetTitle = `${this.isoDate}-${this.uuid}`;
            console.log("spreadsheetTitle: ",this.spreadsheetTitle);
            await doc.createNewSpreadsheetDocument({ title: this.spreadsheetTitle});
            this.doc = doc;
            this.spreadsheetId = this.doc.spreadsheetId;
            await this.getSheet(0);
            return true
        }
    }

    deleteGooglesheet = async(name=false)=>{
        if (!name){
            name = this.spreadsheetTitle;
        };
        let res = await this.driver.files.list()
        if (res){
            if (res.data){
                if (res.data.files && res.data.files.length >0){
                    let files = res.data.files;
                    for (let i = 0; i < files.length; i++){
                        let file = files[0];
                        let fileId = file.id;
                        let fileName = file.name;
                        if (fileName.indexOf(this.spreadsheetTitle) > -1){
                            try{
                                await this.driver.files.delete({fileId: fileId}); 
                            }catch(err){

                            }
                        }
                    }
                }
            }
        }
    }
    getSheet = async(index=0)=>{
        this.currentSheet = this.doc.sheetsByIndex[index]
        return this.currentSheet;
    }

    setRows = async (headerRow, rows)=>{
        await this.currentSheet.setHeaderRow(headerRow);
        for (let i = 0; i < rows.length; i++){
            let row = rows[i];
            await this.currentSheet.addRow(row);
        };
    }

    setYammDefault = async(accountEmail)=>{
        if (!this.currentSheet){
            await this.getSheet(0)
        }
        let email = faker.internet.email();
        await this.currentSheet.setHeaderRow(['Email Address', 'Full Name', 'Prefix', 'First Name', 'Last Name', 'Nickname', 'Company Phone', 'Merge status']);
        await this.currentSheet.addRow({
            'Email Address': accountEmail,
            'Full Name': 'urieah avni',
            'Prefix': 'Sir',
            'First Name': 'Urieah',
            'Last Name': 'Avni',
            'Nickname': 'Uri',
            'Company Phone': '333',
            'Merge status': ''
        })

        await this.currentSheet.addRow({
            'Email Address': email,
            'Full Name': 'lol s',
            'Prefix': '',
            'First Name': 'z',
            'Last Name': '',
            'Nickname': '',
            'Company Phone': '',
            'Merge status': ''
        })

        await this.currentSheet.addRow({
            'Email Address': '',
            'Full Name': '',
            'Prefix': '',
            'First Name': 'none',
            'Last Name': 'd',
            'Nickname': '',
            'Company Phone': '555',
            'Merge status': ''
        })
    }


    // Load client secrets from a local file.
    loadSecretFromLocalFile = async ()=>{
        try{
            let creds = await fs.readFile(this.credentialsPath)
            return creds
        }catch(err){
            console.log('s_api, Error loading client secret file:', err);
            return false
        } 
    }

    authorize = async(credentials)=>{
        const {client_secret, client_id, redirect_uris} = credentials.installed;
        const oAuth2Client = new GoogleOAuth2Client(client_id, client_secret, redirect_uris[0]);
        try{
            let token = await fs.readFile(this.tokenPath);
            oAuth2Client.setCredentials(JSON.parse(token));
            return oAuth2Client
        }catch(err){
            console.log("err: ",err)
            console.log("get new token, re run code later");
            return this.getNewToken(oAuth2Client)
        }
    }

    getCellValue = async(celA1)=>{
        await this.currentSheet.loadHeaderRow();
        await this.currentSheet.loadCells();
        let mergeStatusCell = await this.currentSheet.getCellByA1(celA1);
        let mergeStatusCellVal = mergeStatusCell._rawData.formattedValue;
        // mergeStatusCellBackgroundColor = mergeStatusCell._rawData.effectiveFormat.backgroundColor;
        return mergeStatusCellVal;
    }
}

module.exports.Spreadsheet = Spreadsheet;
