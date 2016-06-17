var utilityMethods = function(){

  //clicks the center of element. can accept locator string
  //or element as argument
  utilityMethods.prototype.clickCenterOf = function(elem){
    if(typeof elem === 'string')
      elem = $(elem);
    elem.getSize().then(function(dimensions){
      browser.actions()
      .mouseMove(elem, {x: dimensions.width/2, y: dimensions.height/2}).click()
      .perform();
    });
  };

  //hovers over center of element. can accept locator string
  //or element as argument
  utilityMethods.prototype.hoverOver = function(elem){
    if(typeof elem === 'string'){
      var e = element(by.css(elem));
      e.getSize().then(function(dim){
        browser.actions()
        .mouseMove(e, {x: dim.width/2, y: dim.height/2}).perform();
      });
    }
    else
    elem.getSize().then(function(dim){
      browser.actions()
      .mouseMove(elem, {x: dim.width/2, y: dim.height/2}).perform();
    });
  };

  //Changes focus to page that contains targetUrl in its url.
  // if closingTabs = true, all other tabs that don't match the targetUrl
  // will be closed.
  utilityMethods.prototype.selectTabByUrlPart = function(targetUrl, closingTabs) {
    var dfd = protractor.promise.defer();
    browser.getAllWindowHandles().then(function(handles){
      if(closingTabs){
        closeUnwantedTabs(targetUrl, handles, handles.length-1);
        browser.driver.sleep(5000);
        browser.getAllWindowHandles().then(function(handles){
          //switch to the last tab that isn't closed.
          browser.switchTo().window(handles[handles.length-1])
          .then(function(){ dfd.fulfill(); });
        });
      } else {
        //find the last tab that contains targetUrl in url
        selectTabByUrlPartHelper(targetUrl, handles, handles.length-1);
      }
    });

    //inner function that closes all unwanted tabs that don't have targetUrl
    //in url.
    function closeUnwantedTabs(targetUrl, handles, idx){
      if(idx >= 0){
        browser.switchTo().window(handles[idx]);
        browser.getCurrentUrl().then(function(currUrl){
          if(!currUrl.includes(targetUrl))
            browser.driver.close();
          closeUnwantedTabs(targetUrl, handles, idx-1);
        });
      }
    }

    //innner function that loops through handles until url found that matches
    //targetUrl.
    function selectTabByUrlPartHelper(targetUrl, handles, idx){
      if(idx >= 0){
        browser.switchTo().window(handles[idx]);
        browser.getCurrentUrl().then(function(currUrl){
          if(!currUrl.includes(targetUrl))
            selectTabByUrlPartHelper(targetUrl, handles, idx-1);
          else
            dfd.fulfill();
        });
      }
    }
    return dfd.promise;
  };

};

module.exports = utilityMethods;
