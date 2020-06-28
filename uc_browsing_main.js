function uc_browsing_main( cb_clicked_at_str, global_setup, global_main_save_setup, my_path  ) 
{
  // take over params into object
  this.cb_clicked_at_str = cb_clicked_at_str;
  this.global_setup = global_setup;
  this.global_main_save_setup = global_main_save_setup;
  this.my_path = my_path;
  
  // bind functions to object
  this.select_by_id = uc_browsing_main_select_by_id.bind(this);
  this.select_item = uc_browsing_main_select_item.bind(this);
  this.select_parent = uc_browsing_main_select_parent.bind(this);
  this.keyb_proc = uc_browsing_main_keyb_proc.bind(this);
  this.clicked_at = uc_browsing_main_clicked_at.bind(this);
  this.switch_display = uc_browsing_main_switch_display.bind(this);
  this.load_setup = uc_browsing_main_load_setup.bind(this);
  this.save_setup = uc_browsing_main_save_setup.bind(this);
  this.init = uc_browsing_main_init.bind(this);
  this.launch = uc_browsing_main_launch.bind(this);
  this.lang_change = uc_browsing_main_lang_change.bind(this);
  this.update_info_panel = uc_browsing_main_update_info_panel.bind(this);


  // object variables
  
  this.myname = 'uc_browsing';
                                    // Storage Objects
  this.setup = uc_browsing_setup;
  this.db_obj;
  this.def_parent_storage;
  this.dbg_log;

                                    // GUI Objects
  this.menubar;
  this.toolbar;
  this.tree_panel;
  this.content_panel;
  this.info_panel;
  this.keyb;
                                    // control variables
  this.curr_tree_part = {};
  this.panel1_selected_items = [];
  this.panel1_selected_items_afterop = [];
  this.cut_items = [];
  this.copied_items = [];  
  this.cloned_items = [];    
  this.panel1_select_idx = 1;
  this.panel1_elem_type = 0;
  this.panel1_new_tree_item_input = false;
  this.panel1_saved_rename_item = null;
  this.panel1_input_too_long_occured = false;
//  this.panel1_display_type = 0;     // 0=tree; 1=bubbles
  this.panel4_display_mode = c_FEATURE_MODE_FAVORITES;
  this.panel4_stree_cfg_selsave = [];
  this.panel4_stree_cfg_storage = [];
  this.text_focus = 0;

  // constructor call
  this.init();    
} 

function uc_browsing_main_lang_change()
{                                 
  this.menubar.init();
  this.toolbar.init(this.panel1_elem_type);
  this.tree_panel.print_title();
  this.content_panel.print_title();
  this.info_panel.print_title();
  this.info_panel.init_gui([]);
  this.features_panel.print_title();
}


function uc_browsing_main_select_by_id(elem_id)
{
                              // print whole tree + create new selection
  this.curr_tree_part = this.db_obj.command({}, "get_tree");
  this.panel1_selected_items = [];                            
  this.panel1_selected_items[0] = this.tree_panel.print_tree(this.curr_tree_part, elem_id);
  this.panel1_select_idx = 1;
                              // save setup
  this.setup.tree_last_selected = this.panel1_selected_items[0].elem_id;
  this.save_setup();
                              // load content of currently selected into Panel 2
                              // To-Do : Try to convince Paul and Marc to separate Title / Short Text from Full Text
  this.content_panel.load_item_content(this.tree_panel.get_item_data(this.tree_panel.get_gui_id(this.setup.tree_last_selected)[0])); 
}


function uc_browsing_main_select_item(submodule, gui_id, mode)
{
  switch (mode)
  {
    case c_KEYB_MODE_CTRL_ONLY : 
        var add_item = true;        // false : 
        var loop_num = this.panel1_selected_items.length;
        var i=0;
        do 
        {
                                    // found selected item
          if (this.panel1_selected_items[i].gui_id == gui_id)
          {
            add_item = false;
            {
                                    // deselect and remove from selected list
              this.tree_panel.markup_items(this.panel1_selected_items[i].gui_id, false);
              this.panel1_selected_items.splice(i, 1);
              loop_num--;
            }
          }   
          else    
            i++;
        } while ( i<loop_num);
        this.panel1_select_idx = this.panel1_selected_items.length;
        if (add_item == true)                                              
        {
          this.panel1_selected_items[this.panel1_select_idx]=this.tree_panel.get_item_data(gui_id);
          this.tree_panel.markup_items(gui_id, true);      
          this.panel1_select_idx++;
        }
    break;

    case c_KEYB_MODE_SHIFT_ONLY :
        // to be defined
    break;
    
    case c_KEYB_MODE_NONE :
                                    // get item object
        var new_item = this.tree_panel.get_item_data(gui_id); 
                                    // if multiple parents -> save default
        if (new_item.isMultiPar)
          this.db_obj.command(this.tree_panel.get_defpar_pairs(gui_id), "set_default_parents");                                      
                                    // renew selection
        var selected_items_old = jQuery.extend(true, [], this.panel1_selected_items);
        this.panel1_selected_items = [];
        this.panel1_selected_items[0] = jQuery.extend(true, {}, new_item);
                                    // save setup
        this.setup.tree_last_selected = new_item.elem_id;
        this.save_setup();
                                    // Siblings ? -> recycle tree data
        var use_loaded_data = 0;
        if ((new_item.elem_id != this.setup.tree_locked_item) && (selected_items_old[0].elem_id != this.setup.tree_locked_item))
        {
          if ((new_item.parent_gui_id == selected_items_old[0].parent_gui_id) && (this.global_setup.display_type == 0))
          {
            use_loaded_data = 1;
          }
        }
        if (use_loaded_data == 1)
        {
          for (var i=0; i<selected_items_old.length; i++)
          {  
            this.tree_panel.markup_items(selected_items_old[i].gui_id, false);
          }
          this.tree_panel.markup_items(new_item.gui_id, true);          
          this.content_panel.load_item_content(new_item);                                              
        }
                                    // otherwise : request tree data from database  
        else
        {
          var on_click_str = "window." + this.cb_clicked_at_str + "(\'uc_browsing\', \'panel1\', \'show_tree\', \'T0_a\', c_KEYB_MODE_NONE);";    
          this.db_obj.command({elemId:[new_item.elem_id], lock_id:this.setup.tree_locked_item, favIds:[], tickerIds:[], cb_fct_call:on_click_str, mode:"tree_only"}, "req_tree");
        }

    break;
    
    default :  
        alert(c_LANG_UC_BROWSING_MSG_INVALID_KEYB_MODE[this.global_setup.curr_lang]);
    break;
  }
}


function uc_browsing_main_select_parent(parent_id)
{
                                    // redraw Main Tree + create new selection
  if (this.panel1_selected_items[0].isMultiPar)                                    
    this.db_obj.command([{elem_id:this.panel1_selected_items[0].elem_id, parent_id:parent_id}], "set_default_parents");   
  var on_click_str = "window." + this.cb_clicked_at_str + "(\'uc_browsing\', \'panel1\', \'show_tree\', \'T0_a\', c_KEYB_MODE_NONE);";            
  this.db_obj.command({elemId:[this.panel1_selected_items[0].elem_id], lock_id:this.setup.tree_locked_item, favIds:[], tickerIds:[], cb_fct_call:on_click_str, mode:"tree_only"}, "req_tree"); 
}
  
  
                                 
                                 

                                 



function uc_browsing_main_keyb_proc(my_key, my_extra_keys, e)
{

  this.dbg_log.add_entry({module:"uc_brow_disp_keyb_proc", sub_function:my_key, side_condition:my_extra_keys, action:e.originalEvent.type});
  this.keyb.keyb_proc(my_key, my_extra_keys, e);

    
//  alert(my_key);  
}




function uc_browsing_main_clicked_at(sender, submodule, item, mode)
{
  this.dbg_log.add_entry({module:"uc_browsing_disp_clicked_at", sender:sender, submodule:submodule, item:item, mode:mode});
  
  switch (sender)
  {
    case "menubar" :
        this.menubar.clicked_at(submodule, item, mode);
    break;
    
    case "panel1" :
                                    // extract GUI ID
        var gui_id = item.substring(0, item.indexOf("_a"));

        switch (submodule)
        {
                                    // normal element selection in Explorer Path or Tree
          case "explorer_select" :
          case "tree_select" :      
            this.select_item(submodule, gui_id, mode);
          break;
                                    // init of tree, content, info panel and feature panel
          case "load_all" :
                                    // get data from database module
            var curr_tree_data = this.db_obj.command({}, "get_tree");                                    
                                    // init info panel and set periodic timer
            this.info_panel = new uc_browsing_infopanel("div_panel3_headline", c_LANG_UC_BROWSING_PANEL3_TITLE, "div_panel3_pad", "uc_browsing", "panel3", this.cb_clicked_at_str, curr_tree_data.ticker); 
            var on_click_str = "window." + this.cb_clicked_at_str + "(\'uc_browsing\', \'panel3\', \'update_info_panel\', \'disp_init\', c_KEYB_MODE_NONE);";
            setTimeout(on_click_str, this.setup.info_timer); 
                                    // init features panel
            this.features_panel = new uc_browsing_features("div_panel4_headline", c_LANG_UC_BROWSING_PANEL4_TITLE, "div_panel4_pad", "uc_browsing", "panel4", this.cb_clicked_at_str, this.db_obj);
            this.curr_sel_favorite_id = 0;
            if (curr_tree_data.fav.length > 0)
            {
              this.features_panel.load_favorites(curr_tree_data.fav);
              document.getElementById('favorite' + this.curr_sel_favorite_id + '_div').style.backgroundColor = '#C0C0F0';
            }
          case "show_tree" :
            if (this.panel1_selected_items_afterop.length != 0)
            {
              this.select_by_id(this.panel1_selected_items_afterop[0].elem_id);  
              this.panel1_selected_items_afterop = [];
            }
            else
              this.select_by_id(this.setup.tree_last_selected);  
            this.toolbar.set_cb_url(this.setup.tree_last_selected);       
          break; 
          case "ticker_only" :
            var curr_tree_data = this.db_obj.command({}, "get_tree");
            this.info_panel.init_gui(curr_tree_data.ticker);
          break;
          case "fav_only" :
                                    // get data from db module
            var curr_tree_data = this.db_obj.command({}, "get_tree");
                                    // extract array to save Cookie
            for (var i=0; i<curr_tree_data.fav.length; i++)
              this.setup.favorites[i] = curr_tree_data.fav[i][0].elem_id;
            this.save_setup();
                                    // load Favorites normally
            if (this.panel4_display_mode == c_FEATURE_MODE_FAVORITES)
            {
              this.curr_sel_favorite_id = 0;
              if (curr_tree_data.fav.length > 0)  
              {
                this.features_panel.load_favorites(curr_tree_data.fav);
                document.getElementById('favorite' + this.curr_sel_favorite_id + '_div').style.backgroundColor = '#C0C0F0';              
              }
            }
            else
            {
                                    // switch back to Favorites after other mode
              this.panel4_display_mode = c_FEATURE_MODE_FAVORITES;
              this.features_panel.init(c_FEATURE_MODE_FAVORITES);
              this.curr_sel_favorite_id = 0;
              if (curr_tree_data.fav.length > 0)  
              {
                this.features_panel.load_favorites(curr_tree_data.fav);
                document.getElementById('favorite' + this.curr_sel_favorite_id + '_div').style.backgroundColor = '#C0C0F0';                   
              }                
                                    // reload element from before Tree Hierarchy Adjustment              
              this.setup.tree_last_selected = this.panel4_stree_cfg_selsave[0].elem_id;
              this.setup.tree_locked_item = [this.setup.tree_data_src_params.root_item];          
              this.panel1_selected_items =  jQuery.extend(true, [], this.panel4_stree_cfg_selsave);                                   
              selected_items_old = jQuery.extend(true, [], this.panel1_selected_items);
              var req_tree_cb_str = "window." + this.cb_clicked_at_str + "(\'uc_browsing\', \'panel1\', \'show_tree\', \'T0_a\', c_KEYB_MODE_NONE);";            
              this.db_obj.command({elemId:this.setup.tree_last_selected, lock_id:this.setup.tree_locked_item, favIds:[], tickerIds:[], cb_fct_call:req_tree_cb_str, mode:"tree_only"}, "req_tree"); 
            }
          break;
                                    // request parents from database to prepare parent menu
          case "open_parent_menu" :
            this.panel1_selected_items[0]=this.tree_panel.get_item_data(gui_id);
            this.panel1_select_idx = 1;
            var myself = this.tree_panel.get_item_data(gui_id);
            var on_click_str = "window." + this.cb_clicked_at_str + "(\'uc_browsing\', \'panel1\', \'show_parent_menu\', \'\', c_KEYB_MODE_NONE);";            
            this.db_obj.command({elem_id:myself.elem_id, cb_fctn_str:on_click_str}, "req_all_parents");
          break;
                                    // open up Menu to choose desired parent node after clicking {...} button
          case "show_parent_menu" : 
            var gui_obj_list = this.db_obj.command({}, "get_all_parents");
            this.tree_panel.print_multi_parent_menu(gui_obj_list);
          break;
          
          case "parent_menu_select" :
            this.select_parent(gui_id);
          break;
            
          case "switch_disp" :
            if (this.global_setup.display_type == 0)
              this.global_setup.display_type = 1;
            else
              this.global_setup.display_type = 0;
            this.global_main_setup_save();               
            this.switch_display(this.global_setup.display_type);
          break; 
            
          default :
            alert(c_LANG_UC_BROWSING_MSG_UNKNOWN_SUBMODULE[this.global_setup.curr_lang] + submodule);
        }
    break;

    case "panel2" :
        this.content_panel.clicked_at(submodule, item, mode);
    break;

    case "panel3" :
        switch (submodule)
        {
          case "ticker_item_link" :
              this.select_by_id(item);
              break;
          case "update_info_panel" :
              this.update_info_panel(item);
              break;
        }
    break;

    case "panel4" :
        switch (submodule)
        {
          case "favorites" :
              this.curr_sel_favorite_id = parseInt(item);
              if (mode == c_KEYB_MODE_CTRL_ONLY)
              {
                this.process_fav_menu(c_LANG_UC_BROWSING_MENUBAR[2][2][0]);
              }
              else
              {
                var my_length = this.setup.favorites.length;
                if (this.panel4_display_mode != c_FEATURE_MODE_FAVORITES)
                {
                  my_length = this.panel4_stree_cfg_storage.length;
                }
                 
                for (var i=0; i<my_length; i++)
                {
                  if (i==this.curr_sel_favorite_id) 
                    document.getElementById('favorite' + i + '_div').style.backgroundColor = '#C0C0F0';
                  else
                    document.getElementById('favorite' + i + '_div').style.backgroundColor = 'transparent';
                }
              }  
              break;        
              
          case "features_cmd" :
              // ### Favorites ###
              if (this.panel4_display_mode == c_FEATURE_MODE_FAVORITES)
              {
                switch(c_LANG_UC_BROWSING_PANEL4_FAVORITES[item][0])
                {
                  // save currently selected tree item as favorite
                  case "favorites_add" :
                      if (this.panel1_selected_items.length==1) 
                      {
                                                        // save currently selected item to last index of favorite item array
                        this.setup.favorites[this.setup.favorites.length] = this.panel1_selected_items[0].elem_id;
                                                        // write this setup into Setups Memory
                        this.save_setup();
                                                        // load favorites in respective panel
                        var req_tree_cb_str = "window." + this.cb_clicked_at_str + "(\'uc_browsing\', \'panel1\', \'fav_only\', \'" + "T0_a\', c_KEYB_MODE_NONE);";            
                        this.db_obj.command({elemId:[], lock_id:0, favIds:this.setup.favorites, tickerIds:[], cb_fct_call:req_tree_cb_str, mode:"fav_only"}, "req_tree");
                      }
                      else
                        alert(c_LANG_WARNING_WRONG_SELECTION[this.global_setup.curr_lang]);  
                      break;
                
                  // load currently selected favorite as selected tree item
                  case "favorites_load" :
                      if (this.curr_sel_favorite_id!=-1) 
                      {
                        this.setup.tree_last_selected = this.setup.favorites[this.curr_sel_favorite_id];
                        var req_tree_cb_str = "window." + this.cb_clicked_at_str + "(\'uc_browsing\', \'panel1\', \'show_tree\', \'T0_a\', c_KEYB_MODE_NONE);";            
                        this.db_obj.command({elemId:this.setup.tree_last_selected, lock_id:[this.setup.tree_data_src_params.root_item], favIds:[], tickerIds:[], cb_fct_call:req_tree_cb_str, mode:"tree_only"}, "req_tree"); 
                      }
                      else
                        alert(c_LANG_WARNING_WRONG_SELECTION[this.global_setup.curr_lang]);  
                      break;
                
                  // delete currently selected favorite
                  case "favorites_del" :
                      if (this.curr_sel_favorite_id!=-1) 
                      {
                                                    // delete element from list
                        this.setup.favorites.splice(this.curr_sel_favorite_id, 1);
                                                    // write list to cookies
                        this.save_setup();
                                                    // update internal variables
                        this.curr_sel_favorite_id = -1;
                                                    // change GUI accordingly
                        var req_tree_cb_str = "window." + this.cb_clicked_at_str + "(\'uc_browsing\', \'panel1\', \'fav_only\', \'" + "T0_a\', c_KEYB_MODE_NONE);";            
                        this.db_obj.command({elemId:[], lock_id:0, favIds:this.setup.favorites, tickerIds:[], cb_fct_call:req_tree_cb_str, mode:"fav_only"}, "req_tree");
                      }
                      else
                        alert(c_LANG_WARNING_WRONG_SELECTION[curr_lang]);  
                      break;
                
                  // delete all favorites
                  case "favorites_del_all" :
                                                    // delete element from list
                      this.setup.favorites = [];
                                                    // write list to cookies
                      this.save_setup();
                                                    // update internal variables
                      this.curr_sel_favorite_id = -1;
                                                    // change GUI accordingly
                      var req_tree_cb_str = "window." + this.cb_clicked_at_str + "(\'uc_browsing\', \'panel1\', \'fav_only\', \'" + "T0_a\', c_KEYB_MODE_NONE);";            
                      this.db_obj.command({elemId:[], lock_id:0, favIds:this.setup.favorites, tickerIds:[], cb_fct_call:req_tree_cb_str, mode:"fav_only"}, "req_tree");
                      break;
                  default :
                      this.features_panel.exec_favorites_cmds(parseInt(item));
                      break;
                }
              }
              // ### Hierarchy Config ###
              else  
              {
                switch(c_LANG_UC_BROWSING_PANEL4_STREE_CFG[item][0])
                {
                  // save currently selected tree item as subordinated tree
                  case "stree_cfg_add" :
                      if (this.panel1_selected_items.length==1) 
                      {
                                    // insert currently selected element as only existing item
                        var whole_tree = this.tree_panel.get_tree();
                                    // Tree Hierarchy starts with current item
                        var last = this.panel4_stree_cfg_storage.length;
                        this.panel4_stree_cfg_storage[last] = jQuery.extend(true, [], [this.panel1_selected_items[0]]);
                        for (var i=0; i<whole_tree.explorer_path.length; i++)
                        {
                          this.panel4_stree_cfg_storage[last].push(whole_tree.explorer_path[i]);
                        }
                                    // same treatment as for Favorites can be taken (yet different storage place)
                        if (this.panel4_stree_cfg_storage.length > 0)  
                        {
                          this.features_panel.load_favorites(this.panel4_stree_cfg_storage);
                          document.getElementById('favorite' + this.curr_sel_favorite_id + '_div').style.backgroundColor = '#C0C0F0';                              
                        }
                      }
                      else
                        alert(c_LANG_WARNING_WRONG_SELECTION[this.global_setup.curr_lang]);  
                      break;
                
                  // load currently selected subtree in tree window
                  case "stree_cfg_load" :
                      if (this.curr_sel_favorite_id!=-1) 
                      {
                        this.setup.tree_last_selected = this.panel4_stree_cfg_storage[this.curr_sel_favorite_id][0].elem_id;
                        var req_tree_cb_str = "window." + this.cb_clicked_at_str + "(\'uc_browsing\', \'panel1\', \'show_tree\', \'T0_a\', c_KEYB_MODE_NONE);";            
                        this.db_obj.command({elemId:this.setup.tree_last_selected, lock_id:[this.setup.tree_data_src_params.root_item], favIds:[], tickerIds:[], cb_fct_call:req_tree_cb_str, mode:"tree_only"}, "req_tree"); 
                      }
                      else
                        alert(c_LANG_WARNING_WRONG_SELECTION[this.global_setup.curr_lang]);  
                      break;
                
                  // delete currently selected subtree
                  case "stree_cfg_del" :
                      if (this.curr_sel_favorite_id>0) 
                      {
                                    // delete element from list
                        this.panel4_stree_cfg_storage.splice(this.curr_sel_favorite_id, 1);
                                    // same treatment as for Favorites can be taken (yet different storage place)
                        this.curr_sel_favorite_id = this.curr_sel_favorite_id - 1;
                        if (this.panel4_stree_cfg_storage.length > 0)
                        {
                          this.features_panel.load_favorites(this.panel4_stree_cfg_storage);     
                          document.getElementById('favorite' + this.curr_sel_favorite_id + '_div').style.backgroundColor = '#C0C0F0';                           
                        }
                      }
                      else
                        alert(c_LANG_WARNING_WRONG_SELECTION[curr_lang]);  
                      break;
                
                  // delete all subtrees
                  case "stree_cfg_del_all" :
                      for(var i=this.panel4_stree_cfg_storage.length-1; i>0; i--)
                      {
                                    // delete element from list
                        this.panel4_stree_cfg_storage.splice(i, 1);
                      }
                                    // same treatment as for Favorites can be taken (yet different storage place)
                      this.curr_sel_favorite_id = 0;
                      if (this.panel4_stree_cfg_storage.length > 0)                      
                      {
                        this.features_panel.load_favorites(this.panel4_stree_cfg_storage);  
                        document.getElementById('favorite' + this.curr_sel_favorite_id + '_div').style.backgroundColor = '#C0C0F0';                              
                      }                        
                      break;
                
                  // move item up by 1 position
                  case "stree_cfg_up" :
                      if (this.curr_sel_favorite_id>1) 
                      {
                                    // delete element from list and insert it one position higher
                        var deleted_item = jQuery.extend(true, [], this.panel4_stree_cfg_storage[this.curr_sel_favorite_id]);
                        this.panel4_stree_cfg_storage.splice(this.curr_sel_favorite_id, 1);
                        this.panel4_stree_cfg_storage.splice(this.curr_sel_favorite_id-1, 0, deleted_item);
                                    // same treatment as for Favorites can be taken (yet different storage place)
                        this.curr_sel_favorite_id = this.curr_sel_favorite_id - 1;                                    
                        if (this.panel4_stree_cfg_storage.length > 0)                                                   
                        {
                          this.features_panel.load_favorites(this.panel4_stree_cfg_storage);
                          document.getElementById('favorite' + this.curr_sel_favorite_id + '_div').style.backgroundColor = '#C0C0F0';                           
                        }
                      }
                      else
                        alert(c_LANG_WARNING_WRONG_SELECTION[curr_lang]);  
                      break;
                  
                  // move item down by 1 position
                  case "stree_cfg_down" :
                      if (this.curr_sel_favorite_id<(this.panel4_stree_cfg_storage.length-1)) 
                      {
                                    // delete element from list and insert it one position lower
                        var deleted_item = jQuery.extend(true, [], this.panel4_stree_cfg_storage[this.curr_sel_favorite_id]);                                    
                        this.panel4_stree_cfg_storage.splice(this.curr_sel_favorite_id, 1);
                        this.panel4_stree_cfg_storage.splice(this.curr_sel_favorite_id+1, 0, deleted_item);
                                    // same treatment as for Favorites can be taken (yet different storage place)
                        this.curr_sel_favorite_id = this.curr_sel_favorite_id + 1;                                    
                        if (this.panel4_stree_cfg_storage.length > 0)               
                        {
                          this.features_panel.load_favorites(this.panel4_stree_cfg_storage); 
                          document.getElementById('favorite' + this.curr_sel_favorite_id + '_div').style.backgroundColor = '#C0C0F0';                               
                        }
                      }
                      else
                        alert(c_LANG_WARNING_WRONG_SELECTION[curr_lang]);  
                      break;
 
                  // save and exit hierarchy config for subtree  
                  case "stree_cfg_finish" :
                      // save to db and perform same action as cancel
                      var on_click_str = "";            
                      if (this.panel4_stree_cfg_storage.length > 1)
                      {
                                    // only save plain array of element IDs
                        var elem_arr = [];
                        for(var i=0; i<this.panel4_stree_cfg_storage.length; i++)
                        {
                          elem_arr.push(this.panel4_stree_cfg_storage[i][0].elem_id);
                        }
                        this.db_obj.command({items:[this.panel4_stree_cfg_storage[0][0]], field_id:"tree_hierarchy", content:elem_arr, lock_id:this.setup.tree_locked_item, cb_fctn_str:on_click_str}, "change_item_field");
                      }
                      else
                      {
                        this.db_obj.command({items:[this.panel4_stree_cfg_storage[0][0]], field_id:"tree_hierarchy", content:[], lock_id:this.setup.tree_locked_item, cb_fctn_str:on_click_str}, "change_item_field");
                      }
                  // cancel button in subtree config (Tree Hierarchy)
                  case "stree_cfg_cancel" :
                                      // restore Favorites Mode
                      var req_tree_cb_str = "window." + this.cb_clicked_at_str + "(\'uc_browsing\', \'panel1\', \'fav_only\', \'T0_a\', c_KEYB_MODE_NONE);";            
                      this.db_obj.command({elemId:[], lock_id:0, favIds:this.setup.favorites, tickerIds:[], cb_fct_call:req_tree_cb_str, mode:"fav_only"}, "req_tree");
                      break;
                  default :
                      this.features_panel.exec_stree_cfg_cmds(parseInt(item));
                      break;
                }
              }
          break;       
        }
    break;
    
    default :
        alert(c_LANG_UC_BROWSING_MSG_UNKNOWN_SENDER[this.global_setup.curr_lang] + sender);
    break;
  }
}


function uc_browsing_main_switch_display(selection)
{
  this.curr_tree_part = this.db_obj.command({}, "get_tree");
  this.tree_panel.print_tree(this.curr_tree_part, this.panel1_selected_items[0].elem_id);  
}


function uc_browsing_main_update_info_panel(source)
{
//  alert(source);
                                    // request data from database 
  var req_tree_cb_str = "window." + this.cb_clicked_at_str + "(\'uc_browsing\', \'panel1\', \'ticker_only\', \'" + "T0_a\', c_KEYB_MODE_NONE);";            
  this.db_obj.command({elemId:[], lock_id:0, favIds:[], tickerIds:[this.setup.info_ticker1_item_id, this.setup.info_ticker2_item_id], cb_fct_call:req_tree_cb_str, mode:"ticker_only"}, "req_tree");
                                    // setup next automatic timer for Info Panel
  var on_click_str = "window." + this.cb_clicked_at_str + "(\'uc_browsing\', \'panel3\', \'update_info_panel\', \'update_info_panel\', c_KEYB_MODE_NONE);";
  setTimeout(on_click_str, this.setup.info_timer);     
}


function uc_browsing_main_load_setup()
{
  if (global_status.global_setup_loaded == true)
  {
    switch (global_status.actual_setup_src_type)
    {
      case c_DATA_SOURCE_TYPE_ID_COOKIE :
            var setup_cookie = new lib_data_cookie(plugin_name, this.my_path, c_DEFAULT_UC_BROWSING_SETUP_COOKIE);
            var my_cookie_content = setup_cookie.read("data");
            if (my_cookie_content != null)
            {
              this.setup.tree_last_selected    = my_cookie_content.tree_last_selected  ;
              this.setup.tree_locked_item      = my_cookie_content.tree_locked_item    ; 
              this.setup.info_ticker1_item_id  = my_cookie_content.info_ticker1_item_id;
              this.setup.info_ticker2_item_id  = my_cookie_content.info_ticker2_item_id;
              this.setup.favorites             = my_cookie_content.favorites;
            }
            else
              alert(c_LANG_UC_BROWSING_MSG_SETUP_LOADING_FAILED[this.global_setup.curr_lang]);
          break;
      default :
          break;
    }
  }
  else
    this.setup = c_DEFAULT_UC_BROWSING_SETUP;
  if (param_item_id != undefined)
    this.setup.tree_last_selected = param_item_id;
}


function uc_browsing_main_save_setup()
{
  if (global_status.global_setup_loaded == true)
  {
    switch (global_status.actual_setup_src_type)
    {
      case c_DATA_SOURCE_TYPE_ID_COOKIE :
            var setup_cookie = new lib_data_cookie(plugin_name, this.my_path, c_DEFAULT_UC_BROWSING_SETUP_COOKIE);
            setup_cookie.write("data", this.setup);
          break;
      default :
          break;
    }
  }
}


function uc_browsing_main_init()
{
                                    // create Logging Function
  this.dbg_log = new lib_dbg_log();
                                    // load 'uc_browsing_setup' from Cookie
  this.load_setup();
                                    // create database object
  this.db_obj = new lib_data_main(this.def_parent_storage, this.setup, this.save_setup, this.global_setup, this.global_main_save_setup); 
}


function uc_browsing_main_launch()
{
                                    // create Panel 1
  this.tree_panel = new lib_tree("div_panel1_headline", c_LANG_UC_BROWSING_MENUBAR[3][3][1], "div_panel1_pad", "uc_browsing", "panel1", this.cb_clicked_at_str);
                                    // create Panel 2
  this.content_panel = new uc_browsing_content("div_panel2_headline", c_LANG_UC_BROWSING_PANEL2_TITLE, "div_panel2_pad", "uc_browsi", "panel2", this.cb_clicked_at_str, this.db_obj, this.global_setup, this.global_main_save_setup); 
                                    // create Menu and ToolBar just below MenuBar                                                  
  this.menubar = new uc_browsing_menubar( 'div_menubar', this, 'menubar', c_LANG_UC_BROWSING_MENUBAR); 
  this.toolbar = new uc_browsing_toolbar( 'div_toolbar', this.cb_clicked_at_str);     
                                    // load content from database and show it
  var req_tree_cb_str = "window." + this.cb_clicked_at_str + "(\'uc_browsing\', \'panel1\', \'load_all\', \'" + "T0_a\', c_KEYB_MODE_NONE);";            
  this.db_obj.command({elemId:[this.setup.tree_last_selected], lock_id:this.setup.tree_locked_item, favIds:this.setup.favorites, tickerIds:[this.setup.info_ticker1_item_id, this.setup.info_ticker2_item_id], cb_fct_call:req_tree_cb_str, mode:"load_all"}, "req_tree");
                                    // set up Keyboard Control
  this.keyb = new uc_browsing_keyb(this);  
}
