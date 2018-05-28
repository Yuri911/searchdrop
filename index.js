const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000
var VK = require('vksdk');
var TelegramBot = require('node-telegram-bot-api');
var fs = require("fs");
var request = require('request');
var http = require('http');

var token = "541725334:AAGpTFXfqgD_eFCH80K8wIYyKcKET6a1DzM";
var bot = new TelegramBot(token, {polling: true});

var vk = new VK({
   'appId'     : 6492327,
   'appSecret' : "HHHjT5kPW8B6QqG4jw3Y",
   'language'  : 'ru'
});

vk.setToken("f8f337a36da3ee6ec3951a830dafb31799ad13605ac349c1a05b32d7c741d55a74044660b7b698a78b177");

vk.setSecureRequests(true);

express()
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))

  setInterval(function() {
      http.get("http://searchdrop-bot.herokuapp.com");
  }, 300000);

bot.on('message', function(msg){
  var chatId = msg.chat.id;
  var groupId = -1001166778478;

  switch (msg.text) {
    case "/start":
    case "Продолжить регистрацию":

      if (msg.from.username != undefined) {
        var keyboard = {
            reply_markup: JSON.stringify({
              keyboard: [
                ['🚚Поставщик'],
                ['💰Продавец']
              ],
              one_time_keyboard: true,
              resize_keyboard: true
            })
        };
        bot.sendMessage(chatId, "✋️ Добро пожаловать в @Searchdrop_bot 🤖, " + msg.from.username + "! \n \n⚠️Чтобы начать пользоваться Ботом🤖нужно пройти простую регистрацию из 3️⃣шагов❗️ \n \n1️⃣ Укажите, кто Вы, Поставщик или Продавец?", keyboard);
      }
      else {
        var keyboard = {
            reply_markup: JSON.stringify({
              keyboard: [
                ['Продолжить регистрацию']
              ],
              one_time_keyboard: true,
              resize_keyboard: true
            })
        };
        bot.sendMessage(chatId, "😢 К сожалению, мы не можем Вас зарегистрировать. Вам необходимо указать имя пользователя в ⚙️Настройках Telegram", keyboard);
      }
      break;
    case "Продолжить регистрацию":
      break;
    case "💰Продавец":
      var keyboard = {
          reply_markup: JSON.stringify({
            one_time_keyboard: true,
            keyboard: [
              [{
                text: 'Отправить телефон',
                request_contact: true
              }]
            ],
            resize_keyboard: true
          })
      };
      bot.sendMessage(chatId, "2️⃣ Отправьте свой номер телефона. Нажмите кнопку \"Отправить телефон\" в меню ниже 👇", keyboard).then(() => {
        bot.once("contact", (msg) => {
          fs.appendFile("phones_sellers.txt", msg.contact.phone_number +  "\r\n", function (callback){
            var keyboard = {
                reply_markup: JSON.stringify({
                  keyboard: [
                    ['🔎Ищу']
                  ],
                  one_time_keyboard: true,
                  resize_keyboard: true
                })
            };
            bot.sendMessage(chatId, "👏Поздравляем, теперь Вы зарегистрированы❗️ \nТеперь Вы можете пользоваться ботом. Напишите \"Ищу\"!", keyboard);
          });
        })
      });
      break;
    case "🔎Ищу":
    case "Ищу":
      bot.sendMessage(chatId, "1️⃣ Вставьте фото. \n2️⃣ Под фото укажите описание❗️").then(()=>{
        bot.once("photo", (msg) => {
          if(msg.caption != null) {
            var fileId = msg.photo[2].file_id;
            bot.sendPhoto(chatId, fileId, {caption: msg.caption + "\n\n" + "📃 Обращаться👉 @" + msg.from.username + "\n"});
            bot.sendPhoto(groupId, fileId, {caption: msg.caption + "\n\n" + "📃 Обращаться👉 @" + msg.from.username + "\n"});
            fs.readFile('providers.txt', { encoding : 'utf8' },
            (err, data) => {
              if (err) throw err;
              data.split('\n').forEach(line => {
                if (line != chatId)
                  bot.sendPhoto(line, fileId, {caption: msg.caption + "\n\n" + "📃 Обращаться👉 @" + msg.from.username + "\n"});
              });
            });
            var path = "./img/";

            if (!fs.existsSync(path)){
                fs.mkdirSync(path);
            }

            bot.downloadFile(fileId, path);

            var filename;
            function dir() {
              fs.readdirSync(path).forEach(file => {
                filename = file;
              })

              vk.request('photos.getWallUploadServer', 120434623, function(data){
                var url = data.response.upload_url;
                const formData = {
                    photo: fs.createReadStream(path+filename),
                };

                request.post({url, formData}, (error, httpResponse, body) => {
                    if (error) {
                        return console.error(error);
                    }
                    var resp = JSON.parse(body);

                    var server = resp.server;
                    var photo = resp.photo;
                    var hash = resp.hash;

                    var options = {'server': server, 'photo': photo, 'hash': hash};

                    vk.request('photos.saveWallPhoto', options, function(ans){
                      var photo_id = ans.response[0].id;
                      var owner_id = ans.response[0].owner_id;

                      var attachments = "photo"+owner_id+"_"+photo_id;

                      var params = {'owner_id':-120434623, 'from_group': 1, 'attachments': attachments, 'message' : msg.caption + "\nОбращаться в Telegram: t.me/" + msg.from.username + " ✅📢\n" + "Наш чат в Telegrame: t.me/podslushano_u_prodavtsov"};
                      vk.request('wall.post', params, function(dat){
                        bot.sendMessage(chatId, "👏Заявка добавлена☝️☝️☝️\nПосмотреть можно в группе👉 vk.com/podslushano_u_prodavtsov");
                      });
                    });
                });
              })
              //fs.unlinkSync(path+filename);
              fs.readdirSync(path).forEach(file => {
                fs.unlinkSync(file);
              })
            }
            setTimeout(dir, 5000);
          }
          else {
            var keyboard = {
                reply_markup: JSON.stringify({
                  keyboard: [
                    ['🔎Ищу']
                  ],
                  one_time_keyboard: true,
                  resize_keyboard: true
                })
            };
            bot.sendMessage(chatId, "❌Отсутствует описание!", keyboard);
          }
        });
      });
      break;
    case "🚚Поставщик":
      var keyboard = {
          reply_markup: JSON.stringify({
            one_time_keyboard: true,
            keyboard: [
              [{
                text: 'Отправить телефон',
                request_contact: true
              }]
            ],
            resize_keyboard: true
          })
      };
      bot.sendMessage(chatId, "2️⃣ Отправьте свой номер телефона. Нажмите кнопку \"Отправить телефон\" в меню ниже 👇", keyboard).then(() => {
        bot.once("contact", (msg) => {
          fs.appendFile("providers.txt", chatId +  "\r\n", function (callback){
            bot.sendMessage(chatId, "👏 Поздравляем Вы зарегистрированы! Теперь Вы будете получать уведомления о 🔎 поиске товаров.\nОбязательно подпишитесь на группу 👉 vk.com/podslushano_u_prodavtsov");
          });
          fs.appendFile("phones_providers.txt", msg.contact.phone_number +  "\r\n", function (callback){});
        })
      });
      break;
    case undefined:
      break;
    case "Текстовые файлы":
      bot.sendMessage(chatId, "Введите пароль: ").then(() => {
        bot.once("message", (msg) => {
          if (msg.text == "12345") {
            bot.sendDocument(chatId, "phones_sellers.txt");
            bot.sendDocument(chatId, "phones_providers.txt");
          }
          else {
            bot.sendMessage(chatId, "Попутали Вы что-то)");
          }
        })
      })
      break;
    case "Проснись!":
      console.log("Я не сплю!");
      break;
    default:
      break;
  }
});
