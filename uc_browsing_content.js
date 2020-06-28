// Class 'uc_browsing_content' -> Panel2
function uc_browsing_content(gui_headline_context, lang_headline, gui_content_context, current_usecase, current_panel, cb_clicked_at_str, db_obj, global_setup, global_main_save_setup)
{
  // save params to object
  this.gui_headline_context = gui_headline_context;
  this.lang_headline = lang_headline;
  this.gui_content_context = gui_content_context;
  this.current_usecase = current_usecase;
  this.current_panel = current_panel;
  this.cb_clicked_at_str = cb_clicked_at_str;
  this.db_obj = db_obj;
  this.global_setup = global_setup;    
  this.global_main_save_setup = global_main_save_setup;
  

  // bind object functions
  this.clicked_at = uc_browsing_content_clicked_at.bind(this);
  this.print_title = uc_browsing_content_print_title.bind(this);
  this.init_gui = uc_browsing_content_init_gui.bind(this);
  this.save_eval = uc_browsing_content_save_eval.bind(this);
  this.set_db = uc_browsing_content_set_db.bind(this);
  this.load_item_content = uc_browsing_load_item_content.bind(this);
 
  // object variables
  this.item_content = {};
  this.item_eval = [];
  this.eval_cat_num = c_LANG_UC_BROWSING_PANEL2_EVAL_CATS.length-1;
  this.empty_eval_struct = [];
  
  
  this.init_gui();
  this.print_title();
    
  my_this = this;
}


function uc_browsing_content_clicked_at(submodule, item, mode)
{
        switch (submodule)
        {
          case "comment" :
          case "content" :
              if (item == "on_focus")
              {
                                    // if new item or change item command still active :
                                    // fire cancel to it
                if (this.text_focus != 0)
                {
                  this.clicked_at("esc_key", "", "cancel_item", c_KEYB_MODE_NONE);
                }
                this.text_focus = 1;
              }
              if (item == "on_blur")
              {
                this.text_focus = 0;
                                    // save text content to database
                var on_click_str = "window." + this.cb_clicked_at_str + "(\'uc_browsing\', \'panel1\', \'show_tree\', \'T0_a\', c_KEYB_MODE_NONE);";            
// URL-Ersetzung : -> Problem : Text-Box nicht HTML-fähig !!!
                if (submodule == "content")
                  this.db_obj.command({items:this.panel1_selected_items, field_id:"content", content:URLlinks(getInnerHTML(document.getElementById("panel2_content_fulltext"))), lock_id:uc_browsing_setup.tree_locked_item, cb_fctn_str:on_click_str}, "change_item_field");
//                this.db_obj.command({items:this.panel1_selected_items, field_id:"content", content:URLlinks(nl2br(getInnerHTML(document.getElementById("panel2_content_fulltext")))), lock_id:uc_browsing_setup.tree_locked_item, cb_fctn_str:on_click_str}, "change_item_field");                
//                this.db_obj.command({items:this.panel1_selected_items, field_id:"content", content:getInnerHTML(document.getElementById("panel2_content_fulltext")), lock_id:uc_browsing_setup.tree_locked_item, cb_fctn_str:on_click_str}, "change_item_field");                
                else
                  this.db_obj.command({items:this.panel1_selected_items, field_id:"comment", content:URLlinks(getInnerHTML(document.getElementById("panel2_comment_fulltext"))), lock_id:uc_browsing_setup.tree_locked_item, cb_fctn_str:on_click_str}, "change_item_field");                
              }                
              
          break;
        }
  
}


function uc_browsing_content_print_title()
{                                  
  setInnerHTML(document.getElementById(this.gui_headline_context), '<B>' + this.lang_headline[this.global_setup.curr_lang] + '</B>');
  $('#' + this.current_panel + '_eval_area').find('div.category_div').ready(function() {
//    alert($(this).attr("className"));
  });  
 

}


function uc_browsing_content_init_gui()
{
  // init object variables  
  for (var i=0; i<this.eval_cat_num; i++)
  {
    this.empty_eval_struct[i] = {};
    this.empty_eval_struct[i].avg = 0.0;
    this.empty_eval_struct[i].num = 0;
  }
  
  // GUI Init
  var my_html = '';
  var on_focus_str = "return window." + this.cb_clicked_at_str + "(\'" + this.current_usecase + "\', \'" + this.current_panel + "\', \'content\', \'on_focus\', c_KEYB_MODE_NONE);";  
  var on_blur_str = "return window." + this.cb_clicked_at_str + "(\'" + this.current_usecase + "\', \'" + this.current_panel + "\', \'content\', \'on_blur\', c_KEYB_MODE_NONE);";    
  my_html = my_html + '                  <H2><div id=\'' + this.current_panel + '_content_headline\' style=\"padding-left:0.5em; margin-top:-0.6em; margin-bottom:0.0em;\">' + c_LANG_MSG_LOADING[this.global_setup.curr_lang] + '</div></H2>';
  my_html = my_html + '                  <div id=\'' + this.current_panel + '_eval_area\' style=\"height:100px; margin-bottom:3.0em;\">';
  my_html = my_html + '                  </div>';
  my_html = my_html + '                  <div id=\'' + this.current_panel + '_content_description\' style=\"margin-left:0.7em; margin-top:1.0em; padding-left:0.1em; padding-right:0.1em; padding-bottom:0.1em; width:944px; height:300px; border-width:0.2em; border-style:solid; border-color:#C0C0F0;\">';
  my_html = my_html + '                    <div id=\'' + this.current_panel + '_content_fulltext\' contenteditable=\"true\" onfocus=\"' + on_focus_str + '\" onblur=\"' + on_blur_str + '\" name=\"myname\" wrap=physical style=\"width:100%; height:100%; background-color:#FFFFFF; border-style:none;\">';  
  my_html = my_html + '                      ' + c_LANG_MSG_LOADING[this.global_setup.curr_lang];
  my_html = my_html + '                    </div>';
  my_html = my_html + '                  </div>';  
//  my_html = my_html + '                  <H4><U><a id=\'' + this.current_panel + '_optional_cb_button\' href="" style=\"padding-left:0.7em; margin-top:-0.6em; margin-bottom:0.0em;\"></a></U></H4>';  

  setInnerHTML(document.getElementById(this.gui_content_context), my_html);
  
  var my_categories = [ "Passung", "Prioritaet", "Info-Qualitaet" ];
  var eval_val_width = 5; // -n .. +n
  var eval_total_gui_width = 200;  //px
  var eval_subelem_gui_width = 200/(2*eval_val_width+1);
  var my_eval_area = document.getElementById(this.current_panel + '_eval_area');


  for (var i=1; i<c_LANG_UC_BROWSING_PANEL2_EVAL_CATS.length; i++)
  {
                                    // create div for current category
    var my_cat_div = document.createElement("div");                                                     
    my_cat_div.style.marginLeft = "0.7em"; 
    my_cat_div.style.marginBottom = "1.5em";
    my_cat_div.style.width = "400px";
    my_cat_div.style.height = "5px"; 
                                    // create name field for category
    var my_cat_textsize = document.createElement("h4");                                                     
    var my_cat_name_div = document.createElement("div");                                                     
    my_cat_name_div.style.cssFloat = "left";
    my_cat_name_div.style.display = "block"; 
    my_cat_name_div.style.paddingRight = "1.0em"; 
    my_cat_name_div.style.width ="100px"; 
    my_cat_name_div.style.height = "3px"; 
    my_cat_name_div.id = "cat#" + String(i-1);
    my_cat_name_div.className = "category_div";
    setInnerHTML(my_cat_name_div, c_LANG_UC_BROWSING_PANEL2_EVAL_CATS[i][this.global_setup.curr_lang]);
    my_cat_textsize.appendChild(my_cat_name_div);   
                                    // .. and add it to eval_area                 
    my_cat_div.appendChild(my_cat_textsize);                                        
                                    // add evaluation scale
    for (var j=-eval_val_width; j<=eval_val_width; j++)
    {
      var my_curr_eval_field_a = document.createElement("a");
      my_curr_eval_field_a.className = "eval_field_a";
      var my_curr_eval_field = document.createElement("div");
      my_curr_eval_field.style.cssFloat = "left";
      my_curr_eval_field.id = "cat#" + String(i-1) + "_evalfield#"+String(j); //+eval_val_width);

      if (j==0)
      {
        my_curr_eval_field.className = 'selected';
        my_curr_eval_field.style.borderBottom = "2px solid #0000FF";       
      }
      else
        my_curr_eval_field.className = 'unselected';        

      if (j<0 )
      {
        var my_color_factor = 1.0 - (j*j*1.0/(eval_val_width*eval_val_width));
        var my_other_val = Math.round(255.0 * (my_color_factor)); //*my_color_factor));
        my_curr_eval_field.style.backgroundColor = "rgb(255, " + my_other_val + ", " + my_other_val + ")";
      }
      else
      {
        var my_color_factor = 1.0 - (j*j*1.0/(eval_val_width*eval_val_width));        
        var my_other_val = Math.round(255.0 * (my_color_factor)); //*my_color_factor));
        my_curr_eval_field.style.backgroundColor = "rgb(" + my_other_val + ", 255, " + my_other_val + ")";
      }
      my_curr_eval_field.style.width = eval_subelem_gui_width.toString() + "px"; 
      my_curr_eval_field.style.height ="25px";
      my_curr_eval_field_a.appendChild(my_curr_eval_field);
      my_cat_div.appendChild(my_curr_eval_field_a);
    }  
    
     my_eval_area.appendChild(my_cat_div);
  }

  // graphical hovering over the eval elements
  $('#' + this.current_panel + '_eval_area').find('a.eval_field_a').hover(
    function () {
      $(this).find('div').css("border-bottom","2px solid #FF00FF");
    },
    function () {
      $(this).find('div.unselected').css("border-bottom","o"); 
      $(this).find('div.selected').css("border-bottom","2px solid #0000FF");       
    }  
  ); 
  
  // click event on eval elements
  $('#' + this.current_panel + '_eval_area').find('a.eval_field_a').bind('mouseup', this.my_this, function() {
    $(this).parent().find('div.selected').css("border-bottom","o").toggleClass('selected unselected');
    $(this).find('div').toggleClass('unselected selected').css("border-bottom","2px solid #0000FF");
    var my_id = $(this).find('div').attr('id');
//    alert(my_id);
    var my_cat_str = my_id.substring(my_id.indexOf("#")+1, my_id.indexOf("_"));
    var my_eval_str = my_id.substring(my_id.indexOf("_")+11, my_id.length);    
//    alert(my_cat_str + "#" + my_eval_str);
    my_this.item_eval[parseInt(my_cat_str)] = parseInt(my_eval_str);
  });



  // create Save-Button  
  var my_eval_save_button_div = document.createElement("div");                                                       
  my_eval_save_button_div.style.marginTop = "2.3em"; 
  my_eval_save_button_div.style.marginLeft = "0.7em"; 
  var my_eval_save_button_span = document.createElement("span");                                                         
  my_eval_save_button_span.style.padding = "3px";
  my_eval_save_button_span.style.border = "2px solid #8080FF";       
  my_eval_save_button_span.style.height = "20px"; 
  var my_eval_save_button_event = document.createElement("a");
  my_eval_save_button_event.id = "my_eval_save_button_a";
  var my_eval_save_button_text = document.createElement("b");
  setInnerHTML(my_eval_save_button_text, 'Save');
  my_eval_save_button_event.appendChild(my_eval_save_button_text); 
  my_eval_save_button_span.appendChild(my_eval_save_button_event);     
  my_eval_save_button_div.appendChild(my_eval_save_button_span);   
  my_eval_area.appendChild(my_eval_save_button_div);                                        

  // highlighting on mousedown  
  $('#my_eval_save_button_a').bind('mousedown', this.my_this, function() {
    $(this).parent().css("border","2px solid #FFFF80");
//    alert("down");
  });

  // unhighlighting + saving on mouseup
  $('#my_eval_save_button_a').bind('mouseup', this.my_this, function() {
    $(this).parent().css("border","2px solid #8080FF");
    my_this.save_eval();
//    alert("up");
  });
    
}


function uc_browsing_content_save_eval()
{
  
  var eval_struct = jQuery.extend(true, [], this.empty_eval_struct);
//  alert(this.item_eval[0]);  
  
  for (var i=0; i<this.eval_cat_num; i++)
  {
    var my_eval = (this.item_eval[i] / this.global_setup.eval_scale_gui) * this.global_setup.eval_scale_db;    
    if (this.item_content.eval != undefined)
    {
      eval_struct[i].num = this.item_content.eval[i].num + 1;
      eval_struct[i].avg = ((this.item_content.eval[i].avg * this.item_content.eval[i].num) + my_eval)/eval_struct[i].num;
    }
    else
    {
      eval_struct[i].num = 1;
      eval_struct[i].avg = my_eval;
    }
  }
  this.item_content.eval = jQuery.extend(true, [], eval_struct);
  var on_click_str = "";
  this.db_obj.command({items:[this.item_content], field_id:"eval", content:eval_struct, lock_id:uc_browsing_setup.tree_locked_item, cb_fctn_str:on_click_str}, "change_item_field");  
}

function uc_browsing_content_set_db(db_obj)
{
  this.db_obj = db_obj;
}

function uc_browsing_load_item_content(item_content)
{
  this.item_content = jQuery.extend(true, {}, item_content);

  for (var i=1; i<c_LANG_UC_BROWSING_PANEL2_EVAL_CATS.length; i++)
  {
    // if not found in Cookie, use Average as Default ...
    if (this.item_content.eval[i-1] == undefined)
      this.item_eval[i-1] = 0.0;
    else
      this.item_eval[i-1] = (this.item_content.eval[i-1].avg / this.global_setup.eval_scale_db) * this.global_setup.eval_scale_gui;    // later on this needs to be filled with the true eval values
    // else use Cookie Value
    
    // set class Name to those eval fields which are selected
  }
  
  setInnerHTML(document.getElementById(this.current_panel + "_content_headline"), this.item_content.name); 
//  document.getElementById(this.current_panel + "_content_fulltext").value = item_content.description;
  setInnerHTML(document.getElementById(this.current_panel + "_content_fulltext"), this.item_content.description);
  // further item content :
  //    - voting
  //    - history
  //    - forum discussion
  //    ...
}


// To-Do-Liste iP7
// ===============
// 
// - Abspeichern in Datenbank (Flow, Struktur)
//   - db_obj in Klasse geholt
//   - lib_data_xml für eval vorbereitet
// - Laden der Bewertungen aus Datenbank beim Laden der Einträge
//   - 
// - Speichern eigener Bewertung in Cookie
//   + Korrektur, falls man Bewertung ändert
// - Sortierung nach Bewertung
// - Umwandlung Cookies in lokalen Speicher
// - Multi-Language-Unterstützung
//   -> noch zu lösen : bei Sprach-Änderung müssen auch Kategorie-Namen umgeladen werden
// - DISCO-Unterstützung
// 
// ==============================================================================
// 
// erledigt :
// - Speicherbutton einrichten im GUI