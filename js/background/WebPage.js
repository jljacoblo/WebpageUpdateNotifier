/*
 * Webpage Updates Notifier
 * Version : v0.1
 * Author : Jacob Lo
 * Date : April 19, 2017
 * Lisence : Apache License Version 2.0, January 2004 http://www.apache.org/licenses/
 */

/////////////////////////////////////////////////////////////////////////////////////////
/// Webpage handler
/////////////////////////////////////////////////////////////////////////////////////////

class WebPage{
  constructor(website, DOMObj) {
    this.name = "name"+Math.floor(Math.random() * 99999);
    this.website = website;
    this.DOMObj = DOMObj;
    this.webInTab = new WebInTab(this.website);
    this.setupSourceListener();

    var that = this;
    this.currentTabId = -2;
    this.webInTab.checkIfUrlExistInTabs(this.website, function(tabId) {
      if (tabId > 0) {
        that.currentTabId = tabId;
        that.setupAlarm();
      }
    });
  }

  setupAlarm() {
    /////////////////////////////////////////////////////////
    /// Alarm timer
    /////////////////////////////////////////////////////////
    var reloadWebsiteAlarm = "reloadWebsiteAlarm"+this.name;
    chrome.alarms.create(reloadWebsiteAlarm, {
        delayInMinutes: 0,
        periodInMinutes: 1
    });

    var that = this;
    function reloadTabCallback() {
      var datas = {
        "tabId" : that.currentTabId
        ,"webName": that.name
      };
      chrome.tabs.executeScript(that.currentTabId, {file: "js/lib/getPagesSource.js"}, function() {
        chrome.tabs.executeScript(that.currentTabId, {code : "var webdata = "+JSON.stringify(datas)+";"}, function() {
          chrome.tabs.executeScript(that.currentTabId, {code : "notify();"});
        });
      });
    }
    function newTabCallback(newTab) {
      that.currentTabId = newTab.id;
      reloadTabCallback();
    }

    chrome.alarms.onAlarm.addListener(function(alarm) {
        if (alarm.name === reloadWebsiteAlarm) {
          if (that.currentTabId > 0) {
            chrome.tabs.reload(that.currentTabId, reloadTabCallback);
          }
          else {
            console.error("It should not load here!!");
            // chrome.tabs.create({url: that.website, active : false}, newTabCallback);
          }
          // chrome.windows.create({url: "http://"+that.website, type: "popup", state : "minimized"}, newWindowsCallback);
          
        }
    });
  }

  setupSourceListener() {
    var that = this;
    chrome.runtime.onMessage.addListener(function(request, sender) {
      if (request.action == "getSource"+that.name) {
        console.log (request);
        if(request.source && request.source.tabId) {
          // chrome.tabs.remove(request.source.datas.tabId);
           
          that.handleUpdateHtml(request.source.html);
        }
      }
    });
  }

  handleUpdateHtml(handlingHtml){
    if (!this.webTitle) {
      var getHtml = HtmlManipulations.htmlAction(handlingHtml, HtmlManipulations.htmlGetTitle);
      this.webTitle = getHtml.manipulatedItems[0];
      console.log ("WEB : " + this.webTitle);
    }
    console.log (this.DOMObj);
  }

  
}

/*
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

  


window.addEventListener("updateSource", function(e) {
  for (var w in globalData.websites) {
    var ob = globalData.websites[w];
    
    if (ob.name === e.data.objName) {
      ob.event = e;
      ob.handleUpdateSource();
    }
  }
});

handleUpdateSource(handlingJson) {
   var that = this;
    var getJson = JsonManipulations.jsonAction(handlingJson, jsonGetRequired);
    
    if (!this.webTitle) {
      var getTitleJson = JsonManipulations.jsonAction(handlingJson, jsonGetTitle);
      this.webTitle = getTitleJson.manipulatedItems;
    }
    
    // TODO : rewrite to handle adblock UI blue box for selection html element wrap
    this.getNeededJson = getJson.manipulatedItems[0]["title"];
    
    if (!this.lastGetNeededJson || this.getNeededJson != this.lastGetNeededJson) {
      console.log ("Old : " + this.lastGetNeededJson + " - New : " + this.getNeededJson);
    
      this.lastGetNeededJson = this.getNeededJson;
      var notificationSettings = {
        "webTitle" : this.webTitle
        ,"lastGetNeededJson" : this.lastGetNeededJson
        ,"website" : this.website
      }
      UIHandler.createNotification(notificationSettings);
    }

    function jsonGetRequired(jsonObj, key) {
      for (var i in that.rules) {
        var rule = that.rules[i];
        if (!(key === rule.ruleKey && jsonObj[key] == rule.ruleObj)) {
          return null;
        }
      }
      return jsonObj;
    }

    function jsonGetTitle(jsonObj, key) {
      if (key === 'tag' && jsonObj[key] === 'head') {
        var head = jsonObj['child'];
        for (var h in head) {
          var node = head[h];
          if (node['tag'] === 'title') {
            var title = node['child'][0];
            return title.text;
          }
        }
      }
      return null;
    }
  }

*/
