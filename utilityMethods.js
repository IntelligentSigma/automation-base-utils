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
    browser.sleep(5000);
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

  utilityMethods.prototype.getDisplayed = function(locatorString) {
    return element.all(by.css(locatorString))
      .filter(function(elem) {
        return elem.isDisplayed();
      })
      .first();
  };

  utilityMethods.prototype.wait = function (waitFunction, timeouts, timeoutMessage) {
    var self = this;
    var timeout = timeouts ? timeouts : browser.testEnv.waitTimeout;

    return browser.wait(waitFunction, timeout, timeoutMessage).then(function(pass){return pass}, function(error){
      //retry if the error is a stale element, half the timeout
      if(error.name == "StaleElementReferenceError") {
        return self.wait(waitFunction, timeout/2, timeoutMessage);
      } else {
        throw error;
      }
    });
  };

  utilityMethods.prototype.click = function (getElementFunction, timeouts, elementDescription, tries) {
    var self = this;
    var timeout = timeouts ? timeouts : browser.testEnv.waitTimeout;

    return this.wait(until.visibilityOf(getElementFunction), timeout, elementDescription + " should be visible before click").then(function () {
      return getElementFunction.click().then(function(pass){return pass}, function(error){
        //try clicking 3 times before throwing ans error
        if (tries) {
          tries = tries + 1;
        } else {
          tries = 0
        }

        if(3 < tries) {
          console.log("retry click error was: " + error);
          return self.click(getElementFunction, timeout, elementDescription, tries);
        } else {
          throw error;
        }
      });
    });
  };

  utilityMethods.prototype.isDisplayedWithRetry = function retryIsDisplayedForStaleElement(el, timeouts, retries, elementDescription) {
    var timeout = timeouts ? timeouts : browser.testEnv.waitTimeout;

    return browser.wait(function () {
      return el.isDisplayed().then(function (displayed) {
        return !!displayed;
      }, function (err) {
        if (retries > 0) {
          console.log("Retrying " + elementDescription);
          return retryIsDisplayedForStaleElement(el, timeout, retries - 1, elementDescription);
        } else {
          throw "error displaying " + elementDescription + " after 3 retries";
        }
      });
    }, timeout, elementDescription + " not displayed !!!");
  };

  utilityMethods.prototype.isDisplayedWithRefresh = function refreshIsDisplayed(el, timeouts, retries, elementDescription) {
    var timeout = timeouts ? timeouts : browser.testEnv.waitTimeout;

    return browser.wait(function () {
      return el.isDisplayed().then(function (displayed) {
        return !!displayed;
      }, function (err) {
        if (retries > 0) {
          console.log("Retrying " + elementDescription);
          browser.refresh();
          browser.sleep(5000);
          return refreshIsDisplayed(el, timeout, retries - 1, elementDescription);
        } else {
          throw "error displaying " + elementDescription + " after 3 retries";
        }
      });
    }, timeout, elementDescription + " not displayed !!!");
  };

  utilityMethods.prototype.waitForPromiseTest = function (getElementFunction, testFn, timeouts, errorDescription) {
    var timeout = timeouts ? timeouts : browser.testEnv.waitTimeout;

    browser.wait(function () {
      var deferred = q.defer();
      getElementFunction().then(function (data) {
        deferred.resolve(testFn(data));
      });
      return deferred.promise;
    }, timeout, errorDescription);
  };

  /**
   * This method helps determine when an element enters or leaves the dom. It helsp avoid the Stale Element reference
   * exception, by first getting the body which is not changing on the page. (unless you are reloading the entire page)
   *
   * @param locator - protractor Locater within the '<body>' tag (example:  By.css['.my-selector)]
   * @param present - whether element is to become present or not present
   * @param timeout -  global timeout
   * @param errorDescription - error description text
   */
  utilityMethods.prototype.waitForUnstableElement = function (locator, present, timeouts, errorDescription) {
    var timeout = timeouts ? timeouts : browser.testEnv.waitTimeout;

    browser.wait(function () {
      return element(By.css('body')).isElementPresent(locator)
          .then(function (isPresent) {
            return (isPresent === present);
          });
    }, timeout, errorDescription);
  };

  /**
   *
   * @param conditionFunc boolean function (example: function () {return typeof item !== "undefined" && typeof item2 !== "undefined"})
   * @param execFunc what to execute when condition is true (example: Done) (example: function() {return true;}) (example: function() {variable = somthingnew()})
   * @param interval how long to wait (ms) before retrying condition
   */

  utilityMethods.prototype.when = function(conditionFunc, execFunc, interval) {when(conditionFunc, execFunc, interval)};

  var when = function (conditionFunc, execFunc, interval){
    if (conditionFunc()){
      execFunc();
    }else{
      setTimeout(function(){when(conditionFunc, execFunc, interval);}, interval);
    }
  };

};

module.exports = utilityMethods;
