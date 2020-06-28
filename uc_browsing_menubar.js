function uc_browsing_menubar(gui_elem_id, main, my_main_name, menu_data)
{
  // take over params into object
  this.gui_elem_id = gui_elem_id;
  this.main = main;
  this.my_main_name = my_main_name;
  this.menu_data = menu_data;
  
  // bind functions to object
  this.process_elem_menu = uc_browsing_main_process_elem_menu.bind(this);
  this.process_type_menu = uc_browsing_main_process_type_menu.bind(this);  
  this.process_fav_menu = uc_browsing_main_process_fav_menu.bind(this);    
  this.clicked_at = uc_browsing_menubar_clicked_at.bind(this);
  this.add_submenu = uc_browsing_menubar_add_submenu.bind(this);
  this.init = uc_browsing_menubar_init.bind(this);

 
  this.old_item = undefined;
  this.old_submenu = undefined;
  this.main.panel1_saved_rename_item = main.panel1_saved_rename_item;
  
  // constructor call
  this.init();    
} 


function uc_browsing_main_process_elem_menu(item)
{
  if (item != "paste_item")
  {
    if (this.main.cut_items.length >0)
    {
      this.main.tree_panel.mark_items_as_cut(this.main.cut_items, false);
    }
    this.main.cut_items = [];
    this.main.copied_items = [];     
    this.main.cloned_items = [];    
  }
  
  switch (item)
  {
    case "input_item" :
        this.main.text_focus = 1;  
        this.main.panel1_input_too_long_occured = false;                                    
        // input new item
        if (this.main.panel1_selected_items.length==1)
        {
          this.main.panel1_new_tree_item_input = true;
          this.main.tree_panel.input_item(true, this.main.panel1_selected_items[0].gui_id, this.main.panel1_selected_items[0].type);
        }
        else
          alert(c_LANG_WARNING_SINGLE_ITEM_NEEDED[this.main.global_setup.curr_lang]);
        break;          
    case "change_item" :
        this.main.text_focus = 1;    
        this.main.panel1_input_too_long_occured = false;        
        if (this.main.panel1_selected_items.length==1)
        {
          this.main.panel1_saved_rename_item = this.main.panel1_selected_items[0];
          this.main.tree_panel.input_item(false, this.main.panel1_selected_items[0].gui_id, this.main.panel1_selected_items[0].type);
        }
        else
          alert(c_LANG_WARNING_SINGLE_ITEM_NEEDED[this.main.global_setup.curr_lang]);
        break;          
    case "delete_item" :
        if (this.main.panel1_selected_items.length!=0) 
        {
          if (this.main.panel1_selected_items[0].elem_id != this.main.setup.tree_data_src_params.root_item)
          {
                                      // new selection : parent of current selection
            var new_sel0 = this.main.tree_panel.get_item_data(this.main.panel1_selected_items[0].parent_gui_id); 
            var selected_items_old = jQuery.extend(true, [], this.main.panel1_selected_items);              
            this.main.panel1_selected_items=[];
            this.main.panel1_selected_items[0]= new_sel0;
            this.main.panel1_select_idx = 1; 
            this.main.setup.tree_last_selected = new_sel0.elem_id;
            this.main.save_setup();
                                      // delete all selected items from database and update tree in GUI
            var sel_item_ids = [];
            for (var i=0; i<selected_items_old.length; i++) {  sel_item_ids[i] = selected_items_old[i].elem_id; }
            var on_click_str = "window." + this.main.cb_clicked_at_str + "(\'uc_browsing\', \'panel1\', \'show_tree\', \'T0_a\', c_KEYB_MODE_NONE);";            
            this.main.db_obj.command({parentId:new_sel0.elem_id, itemId:sel_item_ids, lock_id:this.main.setup.tree_locked_item, cb_fctn_str:on_click_str}, "delete_item");
          }
          else
            alert(c_LANG_WARNING_WRONG_SELECTION[this.main.global_setup.curr_lang]);
        }
        else
          alert(c_LANG_WARNING_NOTHING_SELECTED[this.main.global_setup.curr_lang]);
        break;
    case "clone_item" :
        this.main.cloned_items = jQuery.extend(true, [], this.main.panel1_selected_items);
        break;
    case "copy_item"   :
        this.main.copied_items = jQuery.extend(true, [], this.main.panel1_selected_items);
        break;
    case "cut_item"    :
        this.main.cut_items = jQuery.extend(true, [], this.main.panel1_selected_items);
        this.main.tree_panel.mark_items_as_cut(this.main.panel1_selected_items, true);
        break;
    case "paste_item"  :
                                    // number of destination nodes which are selected == 1
        if (this.main.panel1_selected_items.length==1) 
        {
          if (this.main.cut_items.length != 0) 
          {
            if (!uc_browsing_is_loop(this.main.curr_tree_part, this.main.panel1_selected_items[0], this.main.cut_items)) 
            {
                                    // move items in database
              var on_click_str = "window." + this.main.cb_clicked_at_str + "(\'uc_browsing\', \'panel1\', \'show_tree\', \'T0_a\', c_KEYB_MODE_NONE);";            
              this.main.db_obj.command({src_elem:this.main.cut_items, dst_elem:this.main.panel1_selected_items[0], old_parent_id:this.main.cut_items[0].parent_elem_id ,lock_id:this.main.setup.tree_locked_item, cb_fctn_str:on_click_str}, "move_item"); 
                                    // any further paste operations are only copy operations
                                    // because the source items cannot be removed any more
              this.main.copied_items = this.main.cut_items;
              this.main.cut_items = [];             
            }
            else
              alert(c_LANG_WARNING_CYCLE_DETECTED[this.main.global_setup.curr_lang]);
          }
          else if (this.main.copied_items.length != 0)
          {
            if (!uc_browsing_is_loop(this.main.curr_tree_part, this.main.panel1_selected_items[0], this.main.copied_items)) 
            {
                                    // copy items in database and reload tree
              var on_click_str = "window." + this.main.cb_clicked_at_str + "(\'uc_browsing\', \'panel1\', \'show_tree\', \'T0_a\', c_KEYB_MODE_NONE);";            
              this.main.db_obj.command({src_elem:this.main.copied_items, dst_elem:this.main.panel1_selected_items[0], lock_id:this.main.setup.tree_locked_item, cb_fctn_str:on_click_str}, "copy_item"); 
            }
            else
              alert(c_LANG_WARNING_CYCLE_DETECTED[this.main.global_setup.curr_lang]);
          }
          else if (this.main.cloned_items.length != 0)
          {
            if (!uc_browsing_is_loop(this.main.curr_tree_part, this.main.panel1_selected_items[0], this.main.cloned_items)) 
            {
                                    // clone items in database and reload tree
              var on_click_str = "window." + this.main.cb_clicked_at_str + "(\'uc_browsing\', \'panel1\', \'show_tree\', \'T0_a\', c_KEYB_MODE_NONE);";            
              this.main.db_obj.command({src_elem:this.main.cloned_items, dst_elem:this.main.panel1_selected_items[0], lock_id:this.main.setup.tree_locked_item, cb_fctn_str:on_click_str}, "clone_item"); 
            }
            else
              alert(c_LANG_WARNING_CYCLE_DETECTED[this.main.global_setup.curr_lang]);
          }
          else
            alert(c_LANG_WARNING_NOTHING_IN_MEMORY[this.main.global_setup.curr_lang]); 
        }
        else
          alert(c_LANG_WARNING_SINGLE_ITEM_NEEDED[this.main.global_setup.curr_lang]);        
        break;
        
    case "export_item" :
        if (this.main.panel1_selected_items.length == 1)
        {
          var my_url = window.location.protocol + "//" + window.location.host + window.location.pathname; 
          var my_php_path = my_url+'export_html.php?url=\"'+my_url+
                                            '\"&item_id=\"'+this.main.panel1_selected_items[0].elem_id+
                                            '\"&db_path=\"'+this.main.setup.tree_data_src_path+
                                            '\"&db_type=\"'+this.main.setup.tree_data_src_type+
                                          '\"&root_item=\"'+this.main.setup.tree_data_src_params.root_item+
                                            '\"&db_name=\"'+this.main.setup.tree_data_src_params.db_name+
                                           '\"&php_name=\"'+this.main.setup.tree_data_src_params.php_name+'\"';
          window.open(my_php_path, 'X-Tree-M Export');
        }
        else
          alert(c_LANG_WARNING_SINGLE_ITEM_NEEDED[this.main.global_setup.curr_lang]);             
        break;
        
    case "lock_topic"  :
        if (this.main.panel1_selected_items.length==1) 
        {
                                    // unlock topic if it is locked for the second time
          if (this.main.panel1_selected_items[0].elem_id == this.main.setup.tree_locked_item)
            this.main.setup.tree_locked_item = this.main.setup.tree_data_src_params.root_item;
          else  
            this.main.setup.tree_locked_item = this.main.panel1_selected_items[0].elem_id;
          this.main.save_setup();
                                    // redraw tree
          var on_click_str = "window." + this.main.cb_clicked_at_str + "(\'uc_browsing\', \'panel1\', \'show_tree\', \'T0_a\', c_KEYB_MODE_NONE);";            
          this.main.db_obj.command({elemId:[this.main.panel1_selected_items[0].elem_id], lock_id:this.main.setup.tree_locked_item, favIds:[], tickerIds:[], cb_fct_call:on_click_str, mode:"tree_only"}, "req_tree");
//          this.main.panel1_selected_items = []; 
//          this.main.panel1_selected_items[0] = this.main.tree_panel.get_item_data("T0");
//          this.main.panel1_select_idx = 1;
        }
        else
          alert(c_LANG_WARNING_SINGLE_ITEM_NEEDED[this.main.global_setup.curr_lang]);      
        break;
    case "as_news"     :
        if (this.main.panel1_selected_items.length==1) 
        {
          this.main.setup.info_ticker1_item_id = this.main.panel1_selected_items[0].elem_id;
          this.main.save_setup();
          var req_tree_cb_str = "window." + this.main.cb_clicked_at_str + "(\'uc_browsing\', \'panel1\', \'ticker_only\', \'" + "T0_a\', c_KEYB_MODE_NONE);";            
          this.main.db_obj.command({elemId:[], lock_id:0, favIds:[], tickerIds:[this.main.setup.info_ticker1_item_id, this.main.setup.info_ticker2_item_id], cb_fct_call:req_tree_cb_str, mode:"ticker_only"}, "req_tree");
        }
        else
          alert(c_LANG_WARNING_SINGLE_ITEM_NEEDED[this.main.global_setup.curr_lang]);      
        break;
    case "as_date"     :
        if (this.main.panel1_selected_items.length==1) 
        {
          this.main.setup.info_ticker2_item_id = this.main.panel1_selected_items[0].elem_id;
          this.main.save_setup();
          var req_tree_cb_str = "window." + this.main.cb_clicked_at_str + "(\'uc_browsing\', \'panel1\', \'ticker_only\', \'" + "T0_a\', c_KEYB_MODE_NONE);";            
          this.main.db_obj.command({elemId:[], lock_id:0, favIds:[], tickerIds:[this.main.setup.info_ticker1_item_id, this.main.setup.info_ticker2_item_id], cb_fct_call:req_tree_cb_str, mode:"ticker_only"}, "req_tree");
        }
        else
          alert(c_LANG_WARNING_SINGLE_ITEM_NEEDED[this.main.global_setup.curr_lang]);      
        break;
    default : 
      alert(c_LANG_UC_BROWSING_MSG_UNKNOWN_COMMAND[this.main.global_setup.curr_lang] + item);
    break;
  }
//  alert(item);
}


function uc_browsing_main_process_type_menu(item)
{
  // choose element type
  var item_int = lib_tree_get_type_no(item);
  if (item_int >= 0)
  {                                                  
                                    // set type in Info Bar
    this.toolbar.set_elem_type(item_int);
                                    // set new type for all selected items
    if (this.main.panel1_selected_items.length > 0)
    {
                                    // change type field in database
                                    // create item in database
      var on_click_str = "window." + this.main.cb_clicked_at_str + "(\'uc_browsing\', \'panel1\', \'show_tree\', \'T0_a\', c_KEYB_MODE_NONE);";            
      this.main.db_obj.command({items:this.main.panel1_selected_items, field_id:"type", content:c_LANG_LIB_TREE_ELEMTYPE[item_int+1][0], lock_id:this.main.setup.tree_locked_item, cb_fctn_str:on_click_str}, "change_item_field");
    }
    this.main.panel1_elem_type = item_int;
  }
  else
    alert(c_LANG_UC_BROWSING_MSG_UNKNOWN_ELEM_TYPE[this.main.global_setup.curr_lang]);
}


function uc_browsing_main_process_fav_menu(item)                             
{
  switch (item)
  {
    // save currently selected tree item as favorite
    case c_LANG_UC_BROWSING_MENUBAR[2][1][0] :
      if (this.main.panel1_selected_items.length==1) 
      {
                                        // save currently selected item to last index of favorite item array
        this.main.setup.favorites[this.main.setup.favorites.length] = this.main.panel1_selected_items[0].elem_id;
                                        // write this setup into Setups Memory
        this.main.save_setup();
                                        // load favorites in respective panel
        var req_tree_cb_str = "window." + this.main.cb_clicked_at_str + "(\'uc_browsing\', \'panel1\', \'fav_only\', \'" + "T0_a\', c_KEYB_MODE_NONE);";            
        this.main.db_obj.command({elemId:[], lock_id:0, favIds:this.main.setup.favorites, tickerIds:[], cb_fct_call:req_tree_cb_str, mode:"fav_only"}, "req_tree");
      }
      else
        alert(c_LANG_WARNING_WRONG_SELECTION[this.main.global_setup.curr_lang]);  
    break;
    
    // load currently selected favorite as selected tree item
    case c_LANG_UC_BROWSING_MENUBAR[2][2][0] :
      if (this.curr_sel_favorite_id!=-1) 
      {
        this.main.setup.tree_last_selected = this.main.setup.favorites[this.curr_sel_favorite_id];
        var req_tree_cb_str = "window." + this.main.cb_clicked_at_str + "(\'uc_browsing\', \'panel1\', \'show_tree\', \'T0_a\', c_KEYB_MODE_NONE);";            
        this.main.db_obj.command({elemId:[this.main.setup.tree_last_selected], lock_id:this.main.setup.tree_data_src_params.root_item, favIds:[], tickerIds:[], cb_fct_call:req_tree_cb_str, mode:"tree_only"}, "req_tree"); 
      }
      else
        alert(c_LANG_WARNING_WRONG_SELECTION[this.main.global_setup.curr_lang]);  
    break;
    
    // delete currently selected favorite
    case c_LANG_UC_BROWSING_MENUBAR[2][3][0] :
      if (this.curr_sel_favorite_id!=-1) 
      {
                                    // delete element from list
        this.main.setup.favorites.splice(this.curr_sel_favorite_id, 1);
                                    // write list to cookies
        this.main.save_setup();
                                    // update internal variables
        this.curr_sel_favorite_id = -1;
                                    // change GUI accordingly
        var req_tree_cb_str = "window." + this.main.cb_clicked_at_str + "(\'uc_browsing\', \'panel1\', \'fav_only\', \'" + "T0_a\', c_KEYB_MODE_NONE);";            
        this.main.db_obj.command({elemId:[], lock_id:0, favIds:this.main.setup.favorites, tickerIds:[], cb_fct_call:req_tree_cb_str, mode:"fav_only"}, "req_tree");
      }
      else
        alert(c_LANG_WARNING_WRONG_SELECTION[curr_lang]);  
    break;

    // delete all favorites
    case c_LANG_UC_BROWSING_MENUBAR[2][4][0] :
                                    // delete element from list
      this.main.setup.favorites = [];
                                    // write list to cookies
      this.main.save_setup();
                                    // update internal variables
      this.curr_sel_favorite_id = -1;
                                    // change GUI accordingly
      var req_tree_cb_str = "window." + this.main.cb_clicked_at_str + "(\'uc_browsing\', \'panel1\', \'fav_only\', \'" + "T0_a\', c_KEYB_MODE_NONE);";            
      this.main.db_obj.command({elemId:[], lock_id:0, favIds:this.main.setup.favorites, tickerIds:[], cb_fct_call:req_tree_cb_str, mode:"fav_only"}, "req_tree");
    break;
  }
  
//  alert(item);
}


function uc_browsing_menubar_clicked_at(submodule, item, mode)
{
  switch (submodule)
  { 
    case c_LANG_UC_BROWSING_MENUBAR[0][0][0] : //  c_LANG_UC_BROWSING_MENUBAR[0][0][0] :   // elem_menu
        this.process_elem_menu(item);
        break;
    case c_LANG_UC_BROWSING_MENUBAR[1][0][0] : // type_menu
        this.process_type_menu(item);
        break;
    case c_LANG_UC_BROWSING_MENUBAR[2][0][0] : // fav_menu
        this.process_fav_menu(item);
        break;          
    case c_LANG_UC_BROWSING_MENUBAR[3][1][0][0] : // setup_menu.lang_menu
        this.main.global_setup.curr_lang = parseInt(item) + 1;
        this.main.global_setup_save();
        this.lang_change();
        break;          
    case c_LANG_UC_BROWSING_MENUBAR[3][2][0][0] : // setup_menu.db_type
        switch (item)
        {
          case "0" : // XML at same URL as 
            this.main.setup.tree_data_src_type = c_DATA_SOURCE_TYPE_ID_XML;
            this.main.setup.tree_data_src_path = "local";
            this.main.setup.tree_data_src_params.root_item = "root";
            // alert("XML LOCAL");
            break;
//          case "1" : 
//            this.main.setup.tree_data_src_type = c_DATA_SOURCE_TYPE_ID_XML;
//            this.main.setup.tree_data_src_path = "local";
//            this.main.setup.tree_data_src_params.root_item = "root";
//             // alert("XML WWW");
//            break;
          default :               
            this.main.setup.tree_data_src_type = c_DATA_SOURCE_TYPE_ID_DISCO;
            this.main.setup.tree_data_src_path = "test.disco-network.org/api/odata";
            this.main.setup.tree_data_src_params.root_item = "1";
            // alert("DISCO");
            break;
        }
                                  // save new setup
        this.main.setup.tree_locked_item = this.main.setup.tree_data_src_params.root_item;
        this.main.setup.tree_last_selected = this.main.setup.tree_data_src_params.root_item;
        this.main.setup.favorites = [];
        this.main.setup.info_ticker1_item_id = null;
        this.main.setup.info_ticker2_item_id = null;
        this.main.save_setup();              
        
        break;
    case c_LANG_UC_BROWSING_MENUBAR[3][3][0][0] : // setup_menu.disp_type
          // alert("Display_Type");
          this.main.global_setup.display_type = parseInt(item);
          this.main.global_setup_save();               
          this.switch_display(this.main.global_setup.display_type);                
        break; 
    case c_LANG_UC_BROWSING_MENUBAR[3][4][0][0] : // setup_menu.disp_type
          // alert("Config_Subtree");
                              // Root Element is not valid for this operation
          if (JSON.stringify(this.main.panel1_selected_items[0].elem_id) === JSON.stringify(c_DEFAULT_UC_BROWSING_SETUP.tree_data_src_params.root_item))
          {
            alert(c_LANG_UC_BROWSING_MSG_SELECT_MAIN_TREE[this.main.global_setup.curr_lang]);
          }
          else
          {
                              // save currently selected item for later return
            this.main.panel4_stree_cfg_selsave = jQuery.extend(true, [], this.main.panel1_selected_items);
                              // print new title in Features Panel and show commands
            this.features_panel.init(c_FEATURE_MODE_STREE_CFG);
            this.main.panel4_display_mode = c_FEATURE_MODE_STREE_CFG;  
                              // insert currently selected element as only existing item
            var whole_tree = this.main.tree_panel.get_tree();
                              // Tree Hierarchy already exists -> load
            this.main.panel4_stree_cfg_storage = [];
            if (this.main.panel1_selected_items[0].stree_hier != undefined)
            {
              this.main.panel4_stree_cfg_storage = jQuery.extend(true, [], this.main.panel1_selected_items[0].stree_hier); 
            }
            else
                              // Tree Hierarchy starts with current item
            {  
              this.main.panel4_stree_cfg_storage[0] = jQuery.extend(true, [], [this.main.panel1_selected_items[0]]);
              for (var i=0; i<whole_tree.explorer_path.length; i++)
              {
                this.main.panel4_stree_cfg_storage[0].push(whole_tree.explorer_path[i]);
              }
            }
                              // same treatment as for Favorites can be taken (yet different storage place)
            this.curr_sel_favorite_id = 0;                                    
            if (this.main.panel4_stree_cfg_storage.length > 0)                   
            {
              this.features_panel.load_favorites(this.main.panel4_stree_cfg_storage);
              document.getElementById('favorite' + this.curr_sel_favorite_id + '_div').style.backgroundColor = '#C0C0F0';                
            }
          }
        break; 
    case c_LANG_UC_BROWSING_MENUBAR[3][5][0][0] : // setup_menu.permissions
          // alert("Display_Type");
          var myelem = document.getElementById("permissions0_a");
          setInnerHTML(myelem, "change="+String(uc_browsing_change_permission)); 
          uc_browsing_change_permission = 1-uc_browsing_change_permission;
          var on_click_str = "window." + this.main.cb_clicked_at_str + "(\'uc_browsing\', \'panel1\', \'show_tree\', \'T0_a\', c_KEYB_MODE_NONE);";            
          this.main.db_obj.command({elemId:[this.main.panel1_selected_items[0].elem_id], lock_id:this.main.setup.tree_locked_item, favIds:[], tickerIds:[], cb_fct_call:on_click_str, mode:"tree_only"}, "req_tree"); 
        break;               
    case c_LANG_UC_BROWSING_MENUBAR[4][0][0] : // help_menu
        switch (item)
        {
          case "erase_cookies" :
            this.main.setup = jQuery.extend(true, {}, c_DEFAULT_UC_BROWSING_SETUP);
            this.main.save_setup();
            this.main.global_setup = jQuery.extend(true, {}, c_DEFAULT_GLOBAL_SETUP);
            this.main.global_main_save_setup();
          break;
          case "send_err_log" :
            this.dbg_log.create_email();
          break;
          case "display_hint" :
            alert(c_LANG_UC_BROWSING_HELP_HINTS[this.main.global_setup.curr_lang]);
          break;
          case "source_code" :
            window.open('https://github.com/samohtred/htdocs', 'X-Tree-M Source Code');                  
          break; 
          case "display_version" :
            alert(plugin_name + '\n ' + '\n' + c_LANG_UC_BROWSING_HELP_VERSION[this.main.global_setup.curr_lang] + plugin_version + '\n' + c_LANG_UC_BROWSING_HELP_CREATED[this.main.global_setup.curr_lang] + plugin_date);
          break;
          default :              
            alert(c_LANG_UC_BROWSING_MSG_UNKNOWN_COMMAND[this.main.global_setup.curr_lang] + item);                  
          break;
        }
        break;          
    default :
        alert(c_LANG_UC_BROWSING_MSG_UNKNOWN_SUBMODULE[this.main.global_setup.curr_lang] + submodule);
    break;
  }
}


function uc_browsing_menubar_add_submenu(sub_ul, submenu_data)
{                        
  var sub_title_li = document.createElement("li");  
  sub_title_li.style.cssText = 'background-color: #ccc; float:left; position:relative; display:block;';
  var sub_title_a = document.createElement("a");
  sub_title_a.style.cssText = 'color:#000000; display:block; width:130px; height: 25px; text-decoration:none; text-align:center;  margin:5px;';
  setInnerHTML(sub_title_a, submenu_data[0][this.main.global_setup.curr_lang]);
  sub_title_li.appendChild(sub_title_a);  
  sub_ul.appendChild(sub_title_li); 

  var sub_child_ul = document.createElement("ul");
  sub_child_ul.style.cssText = 'position:absolute; display:none; padding:0px; top:0;left:100%;';
  sub_title_li.appendChild(sub_child_ul);
  
  if (strStartsWith(submenu_data[1][0],'#'))
  {
    var feature_type = -1;
    var command = "";
    var my_feature = submenu_data[1];
    if (my_feature[0] == '#output_list')
    {
      command = my_feature[1];
      for (var i=2; i<my_feature.length; i++)
      {
        var sub_item_li = document.createElement("li");  
        sub_item_li.style.cssText = 'background-color: #ccc; float:left; position:relative; display:block;';
        var sub_item_a_style_str   = 'style=\"color:#000000; display:block; width:130px; height: 25px; text-decoration:none; text-align:center; margin:5px;\" ';
        var sub_item_a_onclick_str = "onclick=\"" + this.main.cb_clicked_at_str + "(\'" + this.main.name + "\', \'" + this.my_main_name + "\', \'" + submenu_data[0][0] + "\', \'" + new String(i-2) + "\', c_KEYB_MODE_NONE);\"";
        var sub_item_a_str = '<a id=\"' + submenu_data[0][0]+ new String(i-2) + '_a\" ' + sub_item_a_style_str + sub_item_a_onclick_str + '>' + my_feature[i] + '</a>';        
        setInnerHTML(sub_item_li, sub_item_a_str);
        sub_child_ul.appendChild(sub_item_li); 
      }
    }
    if (my_feature[0] == '#input_field')
    {
      var my_input_item = document.createElement("input");     
  	  my_input_item.id = my_feature[1] + "_input";
  	  my_input_item.type = "text";
  	  my_input_item.style.cssText = 'color:#000000; display:block; width:130px; height: 25px; text-decoration:none; text-align:center; padding:4px;';
  	  sub_child_ul.appendChild(my_input_item); 
  	  my_input_item.focus();
    }
  }
  else
  {
    for (var i=1; i<submenu_data.length; i++)
    {
      if (Array.isArray(submenu_data[i][0]))
      {
        sub_child_ul = this.add_submenu(sub_child_ul, submenu_data[i]);
      }
      else
      {                
        // multilinguale Einträge als Blätter
      }
    }                          
  }

  return sub_ul;
}


function uc_browsing_menubar_init()
{
  var main_ul = document.createElement("ul");
  var main_ul_id = this.my_main_name + '_ul';
  main_ul.id = main_ul_id;
  main_ul.style.cssText = 'color:#000000; padding:0px; list-style:none; position:absolute; margin-top:-10px;';

  // traverse all menus
  for (var i=0; i<this.menu_data.length; i++)
  {
    var menu = this.menu_data[i];
    // create menu title
    var menu_title_li = document.createElement("li");
    menu_title_li.style.cssText = 'background-color: #ccc; float:left; position:relative; margin-right:1px;';
    var menu_title_a = document.createElement("a");
    menu_title_a.style.cssText = 'color:#000000; text-decoration:none; text-align:center; padding:1px 5px;';
    setInnerHTML(menu_title_a, menu[0][this.main.global_setup.curr_lang]);
    menu_title_li.appendChild(menu_title_a);
    var menu_ul = document.createElement("ul");
    menu_ul.style.cssText = 'position:absolute; left:0; top:100%; display:none; padding:0px;'; 
    // traverse all other items
    for (var j=1; j<menu.length; j++)
    {
      if (Array.isArray(menu[j][0]))
      {
        menu_ul = this.add_submenu(menu_ul, menu[j]);
      }
      else
      {
        var menu_item_li = document.createElement("li"); 
        menu_item_li.style.cssText = 'background-color: #ccc; float:left; position:relative; display:block;';
        var menu_item_a_style_str   = 'style=\"color:#000000; display:block; width:130px; height: 25px; text-decoration:none; text-align:center; margin:5px;\" ';
        var menu_item_a_onclick_str = "onclick=\"" + this.main.cb_clicked_at_str + "(\'" + this.main.name + "\', \'" + this.my_main_name + "\', \'" + menu[0][0] + "\', \'" + menu[j][0] + "\', c_KEYB_MODE_NONE);\"";
        var menu_item_a_str = '<a id=\"' + menu[j][0] + '_a\" ' + menu_item_a_style_str + menu_item_a_onclick_str + '>' + menu[j][this.main.global_setup.curr_lang] + '</a>';        
        setInnerHTML(menu_item_li, menu_item_a_str)
        menu_ul.appendChild(menu_item_li);
      }        
    }
    menu_title_li.appendChild(menu_ul);
    main_ul.appendChild(menu_title_li);  
  }                          
  var my_panel = document.getElementById(this.gui_elem_id); 
  setInnerHTML(my_panel, "");
  my_panel.appendChild(main_ul);
  var onclick_str = "alert('doof')";

                                    // hovering in jQuery
  $('#' + main_ul_id).find('li').hover(
    function () {
      //show its submenu
      $(this).children('ul').stop().show(100);    
    },
    function () {
      //hide its submenu
      $(this).children('ul').stop().delay(100).hide(100);      
    }
  );
  $('#' + main_ul_id).find('a').hover(
    function () {
      $(this).parent('li').css("background-color","gray");
    },
    function () {
      $(this).parent('li').css("background-color","#ccc"); 
    }  
  );
}
 


