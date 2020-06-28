// #############################################################################
// ###  compatibility functions
// #############################################################################



// grundlegendes Escape, um Text in HTML-Elementen nicht uminterpretiert zu bekommen
function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// find out current width of window object "my_window"
function get_total_win_width(my_window)
{
  var ret_val = 0;

  // IE
  if(!my_window.innerWidth)
  {
    if(!(my_window.documentElement.clientWidth == 0))
    {
      //strict mode
      ret_val = my_window.documentElement.clientWidth;
    } 
    else
    {
      //quirks mode
      ret_val = my_window.body.clientWidth;
    } 
  } 
  else 
  {
    //w3c
    ret_val = my_window.innerWidth;
  }
  return ret_val;
}

// find out current height of window object "my_window"
function get_total_win_height(my_window)
{
  var ret_val = 0;

  // IE
  if(!window.innerHeight)
  {
    if(!(document.documentElement.clientHeight == 0))
    {
      //strict mode
      ret_val = document.documentElement.clientHeight;
    } 
    else
    {
      //quirks mode
      ret_val = document.body.clientHeight;
    } 
  } 
  else 
  {
    //w3c
    ret_val = window.innerHeight;
  }

  return ret_val;
}



// code to make sure that the method of a class can see its own instance "this"
if (!Function.prototype.bind) {
  Function.prototype.bind = function (oThis) {
    if (typeof this !== "function") {
      // closest thing possible to the ECMAScript 5 internal IsCallable function
      throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
    }

    var aArgs = Array.prototype.slice.call(arguments, 1), 
        fToBind = this, 
        fNOP = function () {},
        fBound = function () {
          return fToBind.apply(this instanceof fNOP && oThis
                                 ? this
                                 : oThis,
                               aArgs.concat(Array.prototype.slice.call(arguments)));
        };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();

    return fBound;
  };
}


// contains function
function arrayContains(arr, findValue) {
    var i = arr.length;
     
    while (i--) {
        if (arr[i] === findValue) return true;
    }
    return false;
}// See more at: http://www.codemiles.com/javascript-examples/check-array-contains-a-value-using-javascript-t7796.html#sthash.urq6GPZj.dpuf


function strStartsWith(myString, mySubstring)
{
  return myString.indexOf(mySubstring) == 0;
}

function strEndsWith(str, suffix) {                                  
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}                                                                 

// change GUI item ID (parentID#itemID) to item ID
function get_id(gui_id)
{
  var sep_idx = gui_id.indexOf("#");
  return gui_id.substring(sep_idx + 1, gui_id.length);
}

// extract parent ID from GUI item ID
function get_parent_id(gui_id)
{
  var sep_idx = gui_id.indexOf("#");
  return gui_id.substring(0, sep_idx);
}


function getParentIdx(parentId, parentItems)
{
  var parentIdx = -1;
  for (var i=0; i<parentItems.length; i++)
    if (parentItems[i] == parentId)
      return i;
  return null;
}

function getChildren(myObj)
{
  if (myObj.children != null)
    return myObj.children;
  else
    return myObj.childNodes;
}

function getDBElementById(domObj, id) 
{
  var myChildNodes = getChildren(getChildren(domObj)[0]);

  for (var i = 0; i < myChildNodes.length; i++) 
  {
    if (myChildNodes[i].attributes != null)
    {
      if (myChildNodes[i].attributes.length != 0)
      {
        if (myChildNodes[i].attributes["id"] != undefined)
        {
          if (myChildNodes[i].attributes["id"].value == id) 
            return myChildNodes[i];
        }
      }
    }
  }
  return undefined;
}



function getXMLElementById(domObj, id) 
{
  var myChildNodes = domObj.children;

  for (var i = 0; i < myChildNodes.length; i++) 
  {
    if (myChildNodes[i].attributes.length != 0)
    {
      if (myChildNodes[i].attributes["id"] != undefined)
      {
        if (myChildNodes[i].attributes["id"].value == id) 
          return myChildNodes[i];
      }
    }
    
    return getXMLElementById(myChildNodes[i], id);
  }
  return undefined;
}


function setInnerHTML(myObj, content)
{
  var is_value = false;
  if (myObj.value != undefined)
  {
    if (isNaN(myObj.value))
    {
      is_value = true;
    }
  }
  if (is_value == true)
    myObj.value = content;
  else
    if (myObj.innerHTML != undefined)
      myObj.innerHTML = content;
    else
      myObj.textContent = content;

/*
  if (myObj.innerHTML != undefined)
    myObj.innerHTML = content;
  else
    if (myObj.textContent != undefined)
      myObj.textContent = content;
    else
      myObj.value = content;
*/
}


function getInnerHTML(myObj)
{
  if (myObj.id != "")
    return $('#'+myObj.id).html();
  else
  {
    if (myObj.value != undefined)
      return myObj.value;
    else
      if (myObj.innerHTML != undefined)
        return myObj.innerHTML;
      else 
        return myObj.textContent;  
  }        
/*  
  if (myObj.innerHTML != undefined)
    return myObj.innerHTML;
  else
    if (myObj.textContent != undefined)
      return myObj.textContent;
    else 
      return myObj.value;
*/
}



//replace multiple URLs inside a string in html links
function URLlinks(text) {
  // ### Case 1 : URL-Text -> Link
  // find http:// or https:// or ftp:// or file:// or www. but not directly after an HTML tag, after 
  // a quote mark or in the middle of words to avoid wrong replacements; here is a sample text to prove
  // the correctness :
  //  var mytext = 'www.saturn.de Link:www.ntv.de sdoinsdnf <br>http://www.wetter.net osdinosdf<br>sodinfodisf ftp://www.tagesschau.de/imag003.png<br>sdoifnsdwww.kika.deoninoiibiuno<br><span contenteditable=\"false\"><a href=\"www.uno.org\" target=\"_blank\">www.uno.org</a></span>';  
  var regExUrl = /[^>\"\w]((https?|ftp|file):\/\/|www.)\S+(\s+|\<|\n)/gi;    

                                    // place spaces at beginning and end to avoid omitting URLs at beginning or ending of whole text
  var mytext = ' ' + text + ' ';
                                    // change <br> to \n to make them string delimiters instead of normal HTML tags
  mytext = mytext.replace(/<br>/gi,'\n');
                                    // replace URLs by correct HTML code; unfortunately the delimiters are the 1st and last char (must be treated specially)
  mytext = mytext.replace(regExUrl, function f(x){ return x.substr(0,1) + '<span contenteditable=\"false\"><a href=\"' + x.substr(1, x.length-2) + '\" target=\"_blank\">' + x.substr(1, x.length-2) + '</a></span>' + x.substr(x.length-1,1)});   
                                    // change back \n to <br>
  mytext = mytext.replace(/\n/gi,'<br>');
                                    // remove spaces before and after again
  mytext = mytext.substr(1,mytext.length-2);

  // ### Case 2 : Link-Konsistenz (href mit innerem Text synchronisieren)


  return mytext;
}

//replace line breaks with <br> html tags
function nl2br (str, is_xhtml) {   
	var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br />' : '<br>';    
//    alert('#'+str+'#');	
	return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1'+ breakTag +'$2');
}




/////////////////////////////////////////////////////////////////////////////////////////
/// GUI FUNCTIONS
////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////
// displays bar showing the approval rate of an item
//////////////////////////////////////////////////////
// my_eval_area = div container where the eval bar should be placed
// my_eval_value = -100 .. +100 (absolute value is displayed; negative 
//    values in red; positive values in green)
/////////////////////////////////////////////////////
function f_eval_bar(my_eval_area, my_eval_value)
{
  // setups
  var my_eval_val_abs = Math.abs(my_eval_value);
  var c_NUM_GUI_ELEMS = 100;
  var c_SCALE_BAR_DIST = c_NUM_GUI_ELEMS / 5;
  var c_SCALE_BAR_BOT_FORMAT = "2px solid #000000";
  var c_SCALE_BAR_TOP_FORMAT = "1px solid #000000";  
  var c_EVAL_GREEN_BOT_FORMAT = "1px solid #00B000";
  var c_EVAL_GREEN_TOP_FORMAT = "1px solid #00B000";
  var c_EVAL_GREEN_COLOR = "rgb(0, 245, 0)"; 
  var c_EVAL_RED_BOT_FORMAT = "1px solid #FF3030";
  var c_EVAL_RED_TOP_FORMAT = "1px solid #FF3030";
  var c_EVAL_RED_COLOR = "rgb(255, 140, 140)"; 
  var c_EVAL_GREY_BOT_FORMAT = "1px solid #B0B0B0";
  var c_EVAL_GREY_TOP_FORMAT = "1px solid #B0B0B0";
  var c_EVAL_GREY_COLOR = "rgb(245, 245, 245)"; 
  var c_EVAL_FIELD_WIDTH = 4;
  var c_EVAL_FIELD_HEIGHT = 1; 
  if (my_eval_value<0)
  {
    var c_EVAL_BOT_FORMAT = c_EVAL_RED_BOT_FORMAT;
    var c_EVAL_TOP_FORMAT = c_EVAL_RED_TOP_FORMAT;    
    var c_EVAL_COLOR = c_EVAL_RED_COLOR;
  }
  else
  {
    var c_EVAL_BOT_FORMAT = c_EVAL_GREEN_BOT_FORMAT;
    var c_EVAL_TOP_FORMAT = c_EVAL_GREEN_TOP_FORMAT;    
    var c_EVAL_COLOR = c_EVAL_GREEN_COLOR;
  }

  // create formatted container for eval bar
  var my_curr_eval_disp = document.createElement("div"); 
  my_curr_eval_disp.style.width = ((c_NUM_GUI_ELEMS+2) * c_EVAL_FIELD_WIDTH).toString()+"px";
  my_curr_eval_disp.style.cssFloat = "none"; 
  
  // generate eval bar itself
  for (var j=0; j<=c_NUM_GUI_ELEMS; j++)
  {
    var my_curr_eval_field = document.createElement("div");
    if (j != c_NUM_GUI_ELEMS)
    {
      my_curr_eval_field.style.cssFloat = "left";
    }

    if (j<my_eval_val_abs )
    {
      if (j%c_SCALE_BAR_DIST == 0)
      {
        my_curr_eval_field.style.borderBottom = c_SCALE_BAR_BOT_FORMAT;
        my_curr_eval_field.style.borderTop = c_SCALE_BAR_TOP_FORMAT; 
      }
      else
      {
        my_curr_eval_field.style.borderBottom = c_EVAL_BOT_FORMAT;       
        my_curr_eval_field.style.borderTop = c_EVAL_TOP_FORMAT;           
      }
      my_curr_eval_field.style.backgroundColor = c_EVAL_COLOR;
    }
    else
    {
      if (j%c_SCALE_BAR_DIST == 0)
      {
        my_curr_eval_field.style.borderBottom = c_SCALE_BAR_BOT_FORMAT;
        my_curr_eval_field.style.borderTop = c_SCALE_BAR_TOP_FORMAT; 
      }
      else
      {
        my_curr_eval_field.style.borderBottom = c_EVAL_GREY_BOT_FORMAT;       
        my_curr_eval_field.style.borderTop = c_EVAL_GREY_TOP_FORMAT;           
      }

      my_curr_eval_field.style.backgroundColor = c_EVAL_GREY_COLOR;
    }
    my_curr_eval_field.style.width = c_EVAL_FIELD_WIDTH.toString()+"px"; 
    my_curr_eval_field.style.height = c_EVAL_FIELD_HEIGHT.toString()+"px";
        
    my_curr_eval_disp.appendChild(my_curr_eval_field);
  }  
  my_eval_area.appendChild(my_curr_eval_disp);
  return my_curr_eval_disp;
}

function f_append_to_pad(pad, msg)
{
  pad_obj = document.getElementById(pad);
  curr_pad_content = getInnerHTML(pad_obj);
  setInnerHTML(pad_obj, curr_pad_content+'<BR>'+msg);
}