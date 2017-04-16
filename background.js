chrome.browserAction.onClicked.addListener(function(tab) { 
  chrome.windows.create(
      {url: "app.html", type: "popup", width: 800, height: 600});
});

var globalData = {};

var JsonAction = function(jsonObj, actionFunction) {
  var manipulatedItems = [];
  var result = subJsonAction(jsonObj, actionFunction, manipulatedItems);
  return {
    manipulatedItems: manipulatedItems
    , result: result
  }

  function subJsonAction(jsonObj, actionFunction, manipulatedItems) {
    if (!jsonObj || !actionFunction) {
      return {};
    }
    if (jsonObj.constructor === Array) {
      for (var i = 0; i < jsonObj.length; i++) {
        subJsonAction(jsonObj[i], actionFunction, manipulatedItems);
      }
    }
    else {
      for (var key in jsonObj) {
        var doAction = actionFunction(jsonObj, key);
        if (doAction) {
          manipulatedItems.push(doAction);
        }
        else if (isNaN(key)) {
          subJsonAction(jsonObj[key], actionFunction, manipulatedItems);
        }
      }
    }
    return jsonObj;
  }
}

class WebPage{
  constructor(name, website, rules, webRulesTitle) {
    this.name = name;
    this.website = website;
    this.rules = rules;
    this.webRulesTitle = webRulesTitle;
    this.requestCrossDomain();
    this.handleUpdateSource();
  }

  requestCrossDomain() {
    
    // If no url was passed, exit.
    if ( !this.website ) {
      console.log('No site was passed.');
      return false;
    }

    var that = this;

    // Take the provided url, and add it to a YQL query. Make sure you encode it!
    var yql = 'http://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent('select * from html where url="' + this.website + '"' );//  + '&format=xml&callback=cbFunc';
    yql += ' and xpath="/html"';
    yql += '&format=json';
    // Request that YSQL string, and run a callback function.
    // Pass a defined function to prevent cache-busting.
    var response = $.getJSON( yql , saveSource);

    function saveSource(data) {
    
      var event; // The custom event that will be created

      if (document.createEvent) {
        event = document.createEvent("HTMLEvents");
        event.initEvent("updateSource", true, true);
      } else {
        event = document.createEventObject();
        event.eventType = "updateSource";
      }

      event.eventName = "updateSource";
      event.data = data;
      event.data.objName = that.name;
      if (document.createEvent) {
        document.dispatchEvent(event);
      } else {
        document.fireEvent("on" + event.eventType, event);
      }
    }
  }

  handleUpdateSource() {
    if (!this.event) {
      console.log ( "This.event is not set");
      return;
    }
    var e = this.event;
    var that = this;

    var getJson = JsonAction(e.data, jsonGetRequired);
    
    if (!this.webRulesName) {
      var getTitleJson = JsonAction(e.data, jsonGetTitle);
      this.webRulesName = getTitleJson.manipulatedItems[0];
    }

    this.getNeededJson = getJson.manipulatedItems[0]["title"];
    console.log ("Old : " + this.lastGetNeededJson + " - New : " + this.getNeededJson);
    if (!this.lastGetNeededJson || this.getNeededJson != this.lastGetNeededJson) {
      this.lastGetNeededJson = this.getNeededJson;
      var options = {
        "type" : "list"
        ,"title": "Webpage Update Notifier"
        ,"message": "New updates : " + this.event.data.objName // Not using
        ,"expandedMessage": "Go to : " + this.event.data.website// Not using
        ,"iconUrl" : "icon.png"
        ,"requireInteraction" : true // so it wont close for default 5 sec until i set so
        ,"items": [
          { title: "New updates!", message: "Click to open."}
          ,{ title: that.webRulesName, message: ""}
          ,{ title: "", message: this.lastGetNeededJson}
          
        ]
      }
      var nid = "nid" + Math.random() *999999;
      that.nid = nid;
      chrome.notifications.create(nid, options , creationNotificationCallback);
    }

    function creationNotificationCallback(id) {
        chrome.notifications.onClicked.addListener( function (id) {
            if (that.nid === id) {
                chrome.tabs.create({
                    "url" : "http://" + that.website
                    ,"active" : true
                }, creationCallback);
            }
        });
        setTimeout(function() {
            chrome.notifications.clear(id, function(wasCleared) {
                
            });
        }, 2000);
    }

    function jsonGetRequired(jsonObj, key) {
      if (key === that.rules.ruleKey && jsonObj[key] === that.rules.ruleObj) {
        return jsonObj;
      }
      return null;
    }

    function jsonGetTitle(jsonObj, key) {
      if (key === that.webRulesTitle.webRulesKey) {
        var head = jsonObj[key];
        return head[that.webRulesTitle.webRulesKey2];
      }
      return null;
    }

    function creationCallback(notID) {
      if (chrome.runtime.lastError) {
          console.log(chrome.runtime.lastError.message);
      }
    }
  }
}

var webRulesTitle = {
  "webRulesKey" : "head"
  ,"webRulesKey2" : "title"
};
var website1 = new WebPage("website1" , "book.qidian.com/info/3513193", {
  "ruleKey" : "data-eid"
  ,"ruleObj" : "qd_G19"
}, webRulesTitle);
var website2 = new WebPage("website2" , "book.qidian.com/info/1003694333", {
  "ruleKey" : "data-eid"
  ,"ruleObj" : "qd_G19"
}, webRulesTitle);
var website3 = new WebPage("website3" , "book.qidian.com/info/1004608738", {
  "ruleKey" : "data-eid"
  ,"ruleObj" : "qd_G19"
}, webRulesTitle);
var website4 = new WebPage("website4" , "book.qidian.com/info/3638453", {
  "ruleKey" : "data-eid"
  ,"ruleObj" : "qd_G19"
}, webRulesTitle);

globalData.websites = [ website1, website2, website3, website4 ];

window.addEventListener("updateSource", function(e) {
  for (var w in globalData.websites) {
    var ob = globalData.websites[w];
    
    if (ob.name === e.data.objName) {
      ob.event = e;
      ob.handleUpdateSource();
    }
  }
});

var reloadWebsiteAlarm = "reloadWebsiteAlarm";

chrome.alarms.create(reloadWebsiteAlarm, {
    delayInMinutes: 0,
    periodInMinutes: 1
});


chrome.alarms.onAlarm.addListener(function(alarm) {
    if (alarm.name === reloadWebsiteAlarm) {
        for (var w in globalData.websites) {
         globalData.websites[w].requestCrossDomain();
        }
    }
});
