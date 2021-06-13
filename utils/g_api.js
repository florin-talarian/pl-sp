const fs = require('fs').promises;
const readline = require('readline');
const {google} = require('googleapisNew');
const { 
    v1: uuidv1,
    v4: uuidv4,
} = require('uuid');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://mail.google.com/'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.


class Gmail {
  constructor(userEmail) {
    console.log("userEmail: ",userEmail);
    this.emailAddress = userEmail;
    this.tokenPath = this.emailAddress + '-token.json';
    this.credentialsPath = this.emailAddress + '.credentials.json';
    this.initDone = false;
    this.uuid = false;
  }

  init = async ()=>{
    this.gmail = await this.createGmailService();
    this.users = this.gmail.users;
    this.drafts = this.users.drafts;
    this.profile = await this.users.getProfile({userId: 'me'});
    // override it
    this.emailAddress = this.profile.data.emailAddress;
    this.initDone = true;
    this.draft = false;
    this.draftId = false;
    this.uuid = uuidv4()
  }

  createGmailService = async ()=>{
    let creds = await this.loadSecretFromLocalFile();
    if (creds){
      let parsed_creds = JSON.parse(creds)
      let auth = await this.authorize(parsed_creds)
      const gmail = google.gmail({version: 'v1', auth});
      return gmail
    }
  }

  // Load client secrets from a local file.
  loadSecretFromLocalFile = async ()=>{
    try{
      let creds = await fs.readFile(this.credentialsPath)
      return creds
    } catch(err){
      console.log('Error loading client secret file:', err);
      return false
    } 
  }

  authorize = async(credentials)=>{
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    try{
      let token = await fs.readFile(this.tokenPath);
      oAuth2Client.setCredentials(JSON.parse(token));
      return oAuth2Client
      // let gmail = google.gmail({version: 'v1', oAuth2Client});
      // return gmail
    }catch(err){
      console.log("err: ",err)
      console.log("get new token, re run code later");
      return this.getNewToken(oAuth2Client)
    }
  }

  getNewToken = async (oAuth2Client)=>{
    console.log("getNewToken ");
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) return console.error('Error retrieving access token', err);
        oAuth2Client.setCredentials(token);
        // Store the token to disk for later program executions
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
          if (err) return console.error(err);
        });
        return oAuth2Client
      });
    });
  }

  createDraft = async (to, from, subject, messageText)=>{
    if (!this.initDone){
      await this.init()
    }
    let email = {message: `To: ${to}\r\nContent-type: text/html;charset=iso-8859-1\r\nMIME-Version: 1.0\r\nSubject: ${subject}\r\n\r\n${messageText}`}
    let bufferedStr =Buffer.from(email.message).toString('base64')
    let draft = await this.users.drafts.create({'userId': 'me', 'resource': 
      {
        "payload": {
          "headers": [
            {name: "To", value: to},
            {name: 'From', value: from},
            {name: 'Subject', value: subject}
          ]
        },
        'message':{'raw' : bufferedStr}}
      })
    this.draft = draft;
    this.draftId = draft.data.id
    return draft
  }

  deleteDraft = async()=>{
    this.drafts.delete({userId: 'me', id: this.draftId})
  }

  getEmailByUUID = async(uuid)=>{
    let listRequest = await this.users.messages.list({userId: 'me'});
    let messages = listRequest.data.messages;
    for (let i = 0; i < messages.length; i++){
      let messageId = messages[i].id;
      let messageData = await this.users.messages.get({userId: 'me', id: messageId});
      let emailMessage = messageData.data.snippet;
      let payloadHeaders = messageData.data.payload.headers;
      let sender =  await this.getObjectByAttribute(payloadHeaders, 'Sender');
      let subject =  await this.getObjectByAttribute(payloadHeaders, 'Subject');
      if(subject){
        if (subject.value){
          if (subject.value.indexOf(uuid) > -1){
            console.log("Found matching message")
            return({
              "from": sender.value,
              "subject": subject.value,
              "message": emailMessage
            });
          };
        };
      };
    };
    return false
  };

  emailExistByPartialSubject = async(subjectText)=>{
    let listRequest = await this.users.messages.list({userId: 'me'});
    let messages = listRequest.data.messages;
    for (let i = 0; i < messages.length; i++){
      let messageId = messages[i].id;
      let messageData = await this.users.messages.get({userId: 'me', id: messageId});
      let emailMessage = messageData.data.snippet;
      let payloadHeaders = messageData.data.payload.headers;
      let sender =  await this.getObjectByAttribute(payloadHeaders, 'Sender');
      let subject =  await this.getObjectByAttribute(payloadHeaders, 'Subject');
      if(subject){
        if (subject.value){
          if (subject.value.indexOf(subjectText) > -1){
            console.log("Found matching message")
            return true;
          };
        };
      };
    };
    return false
  };

  deleteEmailByPartialSubject = async(subjectText)=>{
    console.log(`${this.emailAddress}, Delete by: ${subjectText}`)
    let listRequest = await this.users.messages.list({userId: 'me'});
    let messages = listRequest.data.messages;
    if (messages){
      console.log("messages.length: ",messages.length);
      for (let i = 0; i < messages.length; i++){
        let messageId = messages[i].id;
        let messageData = await this.users.messages.get({userId: 'me', id: messageId});
        let emailMessage = messageData.data.snippet;
        let payloadHeaders = messageData.data.payload.headers;
        let subject =  await this.getObjectByAttribute(payloadHeaders, 'Subject');
        if(subject){
          if (subject.value){
            if (subject.value.indexOf(subjectText) > -1){
              console.log(`Found message, deleting it`)
              await this.users.messages.delete({userId: "me", id: messageId});
              return true;
            };
          };
        };
      }; 
    }else{
      console.log("NO lenght to messages");
    }
    return false
  };
// 


  getObjectByAttribute = async(list, attr)=>{
    for (let i = 0; i < list.length; i++){
      let obj = list[i];
      if (obj.name==attr){
        return obj
      }
    }
    return false
  }
}

module.exports.Gmail = Gmail;
