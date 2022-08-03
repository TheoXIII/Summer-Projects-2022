var Keyboard = require('node-keylogger');
var k = new Keyboard(getKeyboard());

const safeword = "changeme"; // Change this

const fs = require('fs');
const path = require('node:path')
const wmctrl = require('wmctrl')
const { exec } = require('child_process')

const keystrokes = [];

const start_date = new Date();
const username = require("os").userInfo().username;
const logsDirName = "logs";
const filePath = path.join(logsDirName,username+"_"+getYMD(start_date));
const staticDir = "static";
let lockedUsers = [];

let warnings = 0;
let keystrokesNow = 0;

var recentKeys = [];

const profanityPath = path.join(staticDir,"bad_words")  //Change this

let profanityList = [];

fs.readFile(profanityPath, 'utf8', function(err, data) {
  if (err) {
    console.log(err)
  }
  profanityList = data.split("\n");
});


if (!fs.existsSync(logsDirName)) {
  fs.mkdir(logsDirName, error);
}

writeTime();

function getKeyboard(k) {
  const { execSync } = require('child_process');
  const lines = execSync('libinput list-devices', { encoding: 'utf-8' }).split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("Device") && lines[i].includes("keyboard")) {
      return lines[i+1].split("/").pop();
    }
  }
}

function handleKey(keyEvent) {
  const key = keyEvent.keyId.slice(4,keyEvent.keyId.length);
  keystrokes.push(key);
  fs.appendFile(filePath,key+"-",error);
  if (key.length == 1 && key.match(/[A-Z]|[0-9]/i)) {
    recentKeys.push(key);
    if (recentKeys.length > 20) {
      delete recentKeys[0];
    }
  } else {
    checkProfanity();  
    recentKeys = [];
  }
}


function writeTime() {
  const content = "\n"+(new Date).toISOString()+"\n";
  fs.appendFile(filePath, content, error);
  setTimeout(writeTime, 60000);
}

function error(err, file) {
  if (err) throw err;
}

function getYMD(date) {
  return date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate();
}

function checkProfanity() {
  const str = recentKeys.join("");
  for (let word of profanityList) {
    if (word != "" && str == word.toUpperCase()) {
      recentKeys = [];
      warnings++;
      if (warnings == 3) {
        warningsExceeded();
	break;
      }
      profanityPopup(word);
      break;
    }
  }
  if (str == safeword.toUpperCase()) {
    unlockUsers();
  }
}

function profanityPopup(word) {
  exec("zenity --info --title='Forbidden Word' --text='You have typed forbidden word: "+word+
  "\nYou have "+warnings+"/3 warnings remaining'");  
}

function lockOutUsers(error, stdout, stderr) {
  if (error) {
    console.log(error);
  } else {
    const lines = stdout.split("\n");
    for (const line of lines) {
      const user = line.split(" ")[0];
      if (!(user == "root" || lockedUsers.includes(user))) {
	lockedUsers.push(user);
	exec("pkill -STOP -u '"+user+"'");
      }
    }
  }
}

function unlockUsers() {
  for (const user of lockedUsers) {
    exec("pkill -CONT -u '"+user+"'");
  }
  lockedUsers = [];
  warnings = 0;
}

function warningsExceeded(word) {
  exec("zenity --info --title='Forbidden Word' --text='You have typed forbidden word: "+word+
  "\nYou have used up all your warnings and will now be locked out'");
  exec("w", lockOutUsers);
}

function check_titles(err, wnds) {
  if (err) {
    console.log(err);
    return;
  }
  for (const wnd of wnds) {
    const title = " "+wnd.title+" ";
    for (const word of profanityList) {
      if (word != "" && title.toLowerCase().includes(" "+word.toLowerCase()+" ")) {
        exec("wmctrl -i -c '"+wnd.id+"'");
        zenity_popup("Window closed",
          "The window:\n"+wnd.title+"\nhas been closed due to forbidden word: "+word);
      }
    }
  }
}

function check_titles_periodically(time) {
  wmctrl.list(check_titles);
  setTimeout(check_titles_periodically, time, time);
}

function zenity_popup(title, desc) {
  exec("zenity --info --title='"+title+"' --text='"+desc+"'");
}

check_titles_periodically(5000);

k.on('keypress', handleKey);
k.on('error', console.error);
