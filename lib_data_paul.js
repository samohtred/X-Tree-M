


// Bridge for Paul's approach to make a MySQL database accessible through PHP (alternative to local XML based
// approach)
//
// Usecases : 
//	- Import data from database
//	- Navigate through tree
//	- Track changes (GUI + local content storage + database)
//
// Example :
//   http://datokrat.sirius.uberspace.de/xtreem/getNodeInfos.php?ids[]=1
//        Object { 
//          .name: "Was nützt effektiv dem Weltfrieden?", 
//          .content: "Eine sehr schwierige Frage, die geeignete Werkzeuge braucht, um konstruktiv diskutiert zu werden.", 
//          .author: {…}, 
//          .type: "general", 
//          .children: (1) […], 
//          .parents: [] }
//   http://datokrat.sirius.uberspace.de/xtreem/create_item.php?parentnodeid=1&authorid=1&name=Titel
//   http://datokrat.sirius.uberspace.de/xtreem/changeItem.php?id=1&name=NeuerName&content=NeuerContent



// Class 'lib_data_disco'
function lib_data_paul(data_src_path, data_src_params, defaultParentStorage, global_setup)
{
  // import params
  this.data_src_path = data_src_path;
  this.data_src_params = data_src_params;
  this.defaultParentStorage = defaultParentStorage;
  this.data_root_id = data_src_params.root_item;
  this.global_setup = global_setup;   // don't change any of these setups since they're just copied by reference !!!
  
  // tree functions
  this.write_tree = lib_data_paul_write_tree.bind(this);
  this.req_tree = lib_data_paul_req_tree.bind(this);
  this.get_tree = lib_data_paul_get_tree.bind(this);  

  // item functions
  this.get_multi_parents = lib_data_paul_get_multi_parents.bind(this);
  this.req_all_parents = lib_data_paul_req_all_parents.bind(this);
  this.get_all_parents = lib_data_paul_get_all_parents.bind(this);
  this.item_exists = lib_data_paul_item_exists.bind(this);
  this.create_tree_item = lib_data_paul_create_tree_item.bind(this);
  this.delete_tree_item = lib_data_paul_delete_tree_item.bind(this);
  this.copy_items = lib_data_paul_copy_items.bind(this);
  this.clone_items = lib_data_paul_clone_items.bind(this);
  this.move_items = lib_data_paul_move_items.bind(this);

  // field functions
  this.create_tree_item_field = lib_data_paul_create_tree_item_field.bind(this);
  this.change_tree_item_field = lib_data_paul_change_tree_item_field.bind(this);
  this.get_tree_item_field = lib_data_paul_get_tree_item_field.bind(this);
                    
                    
  // object variables
  this.next_id = 0;               // it's necessary to know which IDs can be created for new items
  this.root_id = "1";

                                  // variables
  this.req_elem_ids   = [];
  this.is_deleted_arr = [];
  this.parent_gui_id_arr = [ null ];
  this.parent_elem_id_arr = [ null ];
  this.req_tree_state = "rts_idle";  
  this.new_item_offs = 0;
  this.level_ct = 0;
  this.del_item_state = "di_idle";
  this.rts_ret_struct = {};
  this.curr_item_parents = [];
  this.move_item_state = "mis_idle";
  this.eval_cat_num = c_LANG_UC_BROWSING_PANEL2_EVAL_CATS.length-1;


  // constructor call
  
  // init object variables  

  c_EMPTY_EVAL_STRUCT = [];
  for (var i=0; i<this.eval_cat_num; i++)
  {
    c_EMPTY_EVAL_STRUCT[i] = {};
    c_EMPTY_EVAL_STRUCT[i].avg = 0.0;
    c_EMPTY_EVAL_STRUCT[i].num = 0;
  }  
  
  
  
//  this.context = Context; //new Context('http://' + this.data_src_path); 
//  this.context.NamedValues.filter('it.NamedValueSetId == 3').toArray().then(
//       function(response) {
//          this.root_id = response[0].Value;
//       }
//     ); 
}





//################################################################################################
//### Tree functions
//################################################################################################


function f_IntArr2StrArr(IntArr)
{
  var StrArr = [];
  if (IntArr != undefined)
  {
    if (IntArr.length > 0)
    {
      for (var i=0; i<IntArr.length; i++)
        StrArr[i] = IntArr[i].toString();
    }
  }
  return StrArr;
}

function get_type_no(typeInternalStr)
{
  for (var i=0; i<c_LANG_LIB_TREE_ELEMTYPE.length; i++)
  {
    if (typeInternalStr == c_LANG_LIB_TREE_ELEMTYPE[i][0])
      return i - 1;
  }
  return -1;
}


function sort(tree_nodes, sibling_start, sibling_len)
{
  for(var i=sibling_start; i<(sibling_start+sibling_len); i++)          // loop over all sibling elements
  {
    var curr_winner_idx = i;
    var my_type_no = get_type_no(tree_nodes[i].type);
    var my_name = tree_nodes[i].name;
    for(var j=i+1; j<(sibling_start+sibling_len); j++)      // loop over all siblings after current elem ...
    {  
      var cmp_type_no = get_type_no(tree_nodes[j].type); 
                                            // ... to find the elem which fits current sort position best     
      if ((my_type_no>cmp_type_no) || ((my_type_no == cmp_type_no) && (my_name > tree_nodes[j].name)))
      {
        my_type_no = cmp_type_no;
        my_name = tree_nodes[j].name;
        curr_winner_idx = j;
      }
    }
    if (curr_winner_idx != i)               // exchange items if necessary
    {
      var hlp = jQuery.extend(true, {}, tree_nodes[i]);
      tree_nodes[i] = jQuery.extend(true, {}, tree_nodes[curr_winner_idx]);
      tree_nodes[curr_winner_idx] = jQuery.extend(true, {}, hlp);
    } 
  }
}



function lib_data_paul_write_tree(iparams)
{
  alert("Paul : Write Tree not yet implemented");
} 


function lib_data_paul_req_tree(iparams)   // iparams = {elemId, lock_id, favIds, tickerIds, cb_fct_call, mode}
//
// possible values for "mode" :
//    "load_all"      -> on X-Tree-M start
//    "tree_only"     -> when only tree item is requested (Explorer Path + Tree-Nodes)
//    "fav_only"      -> only when favorite item is requested (only Explorer Path)
//    "ticker_only"   -> only when new ticker item is selected (only child nodes -> Tree Nodes)
//
{
  f_append_to_pad('div_panel4_pad','lib_data_paul_req_tree');

                                    // check if last operation is already finished
  if (this.req_tree_state == "rts_idle")
  {

                                    // copy input params to save source on splice command
    var iparams_cp = jQuery.extend(true, {}, iparams);
    iparams_cp.elemId = [];
    iparams_cp.elemId[0] = iparams.elemId[0];
    // ###################################################################################################################

    f_append_to_pad('div_panel4_pad','rts_idle');
    // ### first inits before any sub-function call
    this.rts_ret_struct.explorer_path = [];
    this.rts_ret_struct.tree_nodes = [];
    this.rts_ret_struct.fav = [];
    this.rts_ret_struct.ticker = [];  

                                    // kill invalid Favorite ids
    if ((iparams_cp.favIds.length > 0) && ( (iparams_cp.mode == "load_all") || (iparams_cp.mode == "fav_only") ))
    {
      for (var i=0; i<iparams_cp.favIds.length; i++)
      {
        if (iparams_cp.favIds[i] == null)
        {
          this.rts_ret_struct.fav[i] = {};      
          this.rts_ret_struct.fav[i].elem_id = null;
          this.rts_ret_struct.fav[i].name = null;
          this.rts_ret_struct.fav[i].text = null;
          this.rts_ret_struct.fav[i].eval = jQuery.extend(true, [], c_EMPTY_EVAL_STRUCT);
        }
        else
        { 
          this.rts_ret_struct.fav[i] = this.get_explorer_path({elem_id:iparams_cp.favIds[i], lock_id:this.data_root_id});
          var myself_elem = {};
          myself_elem.elem_id = iparams_cp.favIds[i];
          myself_elem.name = this.get_tree_item_field(iparams_cp.favIds[i], "name");
          myself_elem.text = "";
          myself_elem.eval = this.get_tree_item_field(iparams_cp.favIds[i], "eval");        
          this.rts_ret_struct.fav[i].unshift(myself_elem);
        }      
      }   
    }      

    var ticker_len = 0;
                                    // kill invalid ticker ids
    if (iparams_cp.tickerIds.length > 0)
    {
                  // kill invalid ticker ids
      while (iparams_cp.tickerIds[0] == null)
      {
        this.rts_ret_struct.ticker[ticker_len] = {};      
        this.rts_ret_struct.ticker[ticker_len].elem_id = null;
        this.rts_ret_struct.ticker[ticker_len].name = null;
        this.rts_ret_struct.ticker[ticker_len++].text = null;
        iparams_cp.tickerIds.splice(0,1);
        if (iparams_cp.tickerIds.length == 0)
          break;
      }   
    }      

    this.new_item_offs = 0; 
    this.level_ct = 0;
    var is_multi = false;
    this.new_item_offs = 0;          

    if (((iparams_cp.elemId[0] == iparams_cp.lock_id) && ((iparams_cp.mode == "tree_only") || ((iparams_cp.mode == "load_all") && (iparams_cp.favIds.length == 0)))) || (iparams_cp.mode == "ticker_only"))
    {
      this.req_tree_state = "rts_get_tree_items";      
    }
    else
    {
      this.req_tree_state = "rts_get_explorer_path";
    }

    
    // assign request elements depending on mode
    this.req_elem_ids = [];
    switch (iparams_cp.mode)
    {
      case "load_all"    :
        if (iparams_cp.favIds.length == 0)
          this.req_elem_ids[0] = iparams_cp.elemId[0];
        else
          this.req_elem_ids[0] = iparams_cp.favIds[0];     
      break;
      case "tree_only"   :
        this.req_elem_ids[0] = iparams_cp.elemId[0];
      break;
      case "fav_only"    :
        if (iparams_cp.favIds.length == 0)
        {
          this.req_tree_state = "rts_idle";
          eval(iparams_cp.cb_fct_call);
        }
        else
          this.req_elem_ids[0] = iparams_cp.favIds[0];     
      break;
      case "ticker_only" :
        if (iparams_cp.tickerIds.length == 0)
        {
          this.req_tree_state = "rts_idle";
          eval(iparams_cp.cb_fct_call);
        }
        else
          this.req_elem_ids = iparams_cp.tickerIds[0];
      break;
      default :
        alert("wrong mode for function \'req_tree\'");
      break;
    }
    this.is_deleted_arr = new Array(this.req_elem_ids.length).fill(0);


    // sub-function content
    var do_get_tree = function(id) 
    {
      f_append_to_pad('div_panel4_pad','Start#'+String(id));

      if (this.req_elem_ids != undefined)
      {
        switch (this.req_tree_state)
        {
          // ### part 1 : Explorer Path
        
          // # get tree part from DB for Explorer path
          case "rts_get_explorer_path" :
            this.req_tree_state = "wait_post_processing";
            f_append_to_pad('div_panel4_pad','rts_get_explorer_path');
            if (this.req_elem_ids.length > 0)
            {
              // generate id param list for post
              var id_params = "";
              for (k=0; k<this.req_elem_ids.length; k++)
              {
                id_params = id_params + "ids[]=" + this.req_elem_ids[k];
                if (k<this.req_elem_ids.length-1)
                {
                  id_params = id_params + "&";
                } 
              }
              if (uc_browsing_change_permission == 1)
              {
                id_params = id_params + "&showDeleted=1";
              }
              f_append_to_pad('div_panel4_pad','rts_get_explorer_path_before_post');
              // send post and handle responses
              $.post(this.data_src_path+"get?"+id_params, { })
                .done(function(data) {
                  f_append_to_pad('div_panel4_pad','rts_get_explorer_path_after_post');
                  if (data != undefined)
                  {
                    f_append_to_pad('div_panel4_pad','rts_get_explorer_path_rxdata_good');
                    if (data.nodes.length > 0) {
//                        alert("Explorer - Content : " + data[1].name);
// ###  #################################################################################################################################
                      // # local inits
                      var elem_id = this.req_elem_ids[0];
                      var my_parent_ids = f_IntArr2StrArr(data.nodes[0].parents);  
                      var is_multi = false;
        
                      var parent_exists = false;
        
                      // Any parents further up ?
                      if (my_parent_ids != undefined)
                      {
                        if (my_parent_ids.length > 0)
                        { 
                          parent_exists = true;                                                  
                        }
       
                        // multiple parents ? -> choose one depending on Cookie
                        if (my_parent_ids.length > 1)
                        {
                                        // read from Cookie which parent item applies here
                          my_parent_ids = this.get_multi_parents(elem_id, my_parent_ids);  
                          is_multi = true;   
                        }
                      }

                      // currently processing selected item -> fill in T0
                      if (iparams_cp.elemId[0] == this.req_elem_ids[0])
                      {
                        this.rts_ret_struct.tree_nodes[0] = {};                                         
                        this.rts_ret_struct.tree_nodes[0].elem_id = this.req_elem_ids[0];
                        this.rts_ret_struct.tree_nodes[0].gui_id = "T0";      
                        this.rts_ret_struct.tree_nodes[0].name = unescape(data.nodes[0].name); 
                        if (data.nodes[0].parents.length > 0)
                        {
                          this.rts_ret_struct.tree_nodes[0].parent_elem_id = my_parent_ids;
                          this.rts_ret_struct.tree_nodes[0].parent_gui_id = "E0";
                        }
                        else
                        {
                          this.rts_ret_struct.tree_nodes[0].parent_elem_id = null;
                          this.rts_ret_struct.tree_nodes[0].parent_gui_id = null;
                        }
                        if (data.nodes[0].parents.length > 1)
                          this.rts_ret_struct.tree_nodes[0].isMultiPar = true;             
                        else                                                               
                          this.rts_ret_struct.tree_nodes[0].isMultiPar = false;
                        this.rts_ret_struct.tree_nodes[0].description = unescape(data.nodes[0].content);     
                        this.rts_ret_struct.tree_nodes[0].type = get_xtype("1", data.nodes[0].type);  
                        this.rts_ret_struct.tree_nodes[0].eval = c_EMPTY_EVAL_STRUCT;
                        this.rts_ret_struct.tree_nodes[0].children_elem_id = f_IntArr2StrArr(data.nodes[0].children); 
                      }
                      // fill in E[n]
                      else
                      {
                        // # create current item
                        this.rts_ret_struct.explorer_path[this.new_item_offs] = {};                                         
                        this.rts_ret_struct.explorer_path[this.new_item_offs].elem_id = this.req_elem_ids[0];
                        this.rts_ret_struct.explorer_path[this.new_item_offs].gui_id = "E" + this.new_item_offs;      
                        this.rts_ret_struct.explorer_path[this.new_item_offs].name = unescape(data.nodes[0].name); 
                        if (my_parent_ids[0] == undefined)
                        {
                          this.rts_ret_struct.explorer_path[this.new_item_offs].parent_elem_id = null;
                          this.rts_ret_struct.explorer_path[this.new_item_offs].parent_gui_id = null;      
                        }
                        else
                        {
                          this.rts_ret_struct.explorer_path[this.new_item_offs].parent_elem_id = my_parent_ids[0];
                          this.rts_ret_struct.explorer_path[this.new_item_offs].parent_gui_id = "E" + (this.new_item_offs+1);     
                        }
                        this.rts_ret_struct.explorer_path[this.new_item_offs].children_elem_id = f_IntArr2StrArr(data.nodes[0].children); 
                        this.rts_ret_struct.explorer_path[this.new_item_offs].parent_gui_id = null; 
                        this.rts_ret_struct.explorer_path[this.new_item_offs].isMultiPar = is_multi;
                        this.rts_ret_struct.explorer_path[this.new_item_offs].eval = c_EMPTY_EVAL_STRUCT;  
                        this.new_item_offs = this.new_item_offs + 1;                         
                      }
                                   
                      // More parents above and no LockID in sight ? -> Go on with Explorer Path
                      if ((parent_exists == true) && (this.req_elem_ids[0] != iparams_cp.lock_id))
                      {
                        this.level_ct++;
                        this.req_elem_ids = [my_parent_ids[0]];
                        this.req_tree_state = "rts_get_explorer_path";  
                        do_get_tree(id+1);
                      }
                      // no more parent items further up
                      else
                      {
                        this.level_ct = 0;
                        this.new_item_offs = 1;    
                        this.req_elem_ids = this.rts_ret_struct.tree_nodes[0].children_elem_id;   

                        if (this.req_elem_ids == undefined)
                        {
                          this.req_tree_state = "rts_idle";  
                          f_append_to_pad('div_panel4_pad','Callback after 1st item');    
                          eval(iparams_cp.cb_fct_call);                    
                        } 
                        else
                        {
                          if (this.req_elem_ids.length > 0)
                          {
                            this.req_tree_state = "rts_get_tree_items";
                            this.is_deleted_arr = new Array(this.req_elem_ids.length).fill(0);
                            if (this.rts_ret_struct.explorer_path.length >0 )
                            {
                              this.parent_gui_id_arr = [ this.rts_ret_struct.explorer_path[0].parent_gui_id ];
                              this.parent_elem_id_arr = [ this.rts_ret_struct.explorer_path[0].parent_elem_id ];
                            }
                            f_append_to_pad('div_panel4_pad','Go on with tree nodes');
                            do_get_tree(id+1);                                                                  
                          }
                          else 
                          {
                            this.req_tree_state = "rts_idle";  
                            f_append_to_pad('div_panel4_pad','Callback after 1st item');    
                            eval(iparams_cp.cb_fct_call);                                 
                          }
                        }
                      }
                      
                      //// Root Item -> create first Tree Node and look for parents in Explorer Path afterwards
                      //else
                      //{
                      //  var my_ref_type = "1";
                      //  this.rts_ret_struct.tree_nodes[0] = {};
                      //  this.rts_ret_struct.tree_nodes[0].elem_id = this.req_elem_ids[0];
                      //  this.rts_ret_struct.tree_nodes[0].gui_id = "T0";
                      //  this.rts_ret_struct.tree_nodes[0].name = unescape(data.name);
                      //  this.rts_ret_struct.tree_nodes[0].description = unescape(data.content);     
                      //  this.rts_ret_struct.tree_nodes[0].type = get_xtype(my_ref_type, data.type); 
                      //  this.rts_ret_struct.tree_nodes[0].children_elem_id = data.children;
                      //  this.rts_ret_struct.tree_nodes[0].eval = c_EMPTY_EVAL_STRUCT;
                      //  this.level_ct = 0;
                      //
                      //  // More parents above and no LockID in sight ? -> Go on with Explorer Path
                      //  if ((parent_exists == true) && (this.req_elem_ids[0] != iparams_cp.lock_id))
                      //  {
                      //    this.rts_ret_struct.tree_nodes[0].parent_elem_id = my_parent_ids[0];
                      //    this.rts_ret_struct.tree_nodes[0].parent_gui_id = "E0"; 
                      //    this.rts_ret_struct.tree_nodes[0].isMultiPar = is_multi; 
                      //    this.level_ct++;
                      //    this.new_item_offs = 0;  
                      //    this.req_elem_ids = [my_parent_ids[0]];
                      //    this.req_tree_state = "rts_get_explorer_path";
                      //  }
                      //  else
                      //  {
                      //    this.rts_ret_struct.tree_nodes[0].parent_elem_id = null;
                      //    this.rts_ret_struct.tree_nodes[0].parent_gui_id = null; 
                      //    this.new_item_offs = 1;  
                      //    this.req_elem_ids = data.children;
                      //    this.req_tree_state = "rts_get_tree_items";
                      //  }
                      //  
                      //  if (this.req_elem_ids == undefined)
                      //  {
                      //    this.req_tree_state = "rts_idle";  
                      //    f_append_to_pad('div_panel4_pad','Callback after 1st item');    
                      //    eval(iparams_cp.cb_fct_call);                    
                      //  } 
                      //  
                      //  do_get_tree(id+1);
                      //}
                          
        
//                      // end of Explorer Path algorithm
//                      {                     
//                        // favorite item processing has been running
//                        if ((iparams_cp.mode == "fav_only") || ((iparams_cp.mode == "load_all")&&(iparams_cp.favIds.length > 0)))
//                        {
//                          var fav_len = this.rts_ret_struct.fav.length;
//                          ret_struct.fav[fav_len] = jQuery.extend(true, [], ret_struct.explorer_path);
//                          ret_struct.fav[fav_len++].unshift(jQuery.extend(true, {}, ret_struct.tree_nodes[0]));
//                          ret_struct.explorer_path = [];
//                          iparams_cp.favIds.splice(0,1);
//                          req_elem_ids = iparams_cp.elemId[0];                     
//                          this.new_item_offs = 0;                    
//                          if (iparams_cp.favIds.length > 0)
//                          {
//                            this.req_tree_state = "rts_get_explorer_path";
//                            req_elem_ids = iparams_cp.favIds[0];
//                          }
//                          else
//                          {
//                            if ((iparams_cp.mode == "load_all") && (iparams_cp.elemId[0] != iparams_cp.lock_id))
//                            {
//                              this.req_tree_state = "rts_get_explorer_path";
//                            }
//                            else  // "fav_only" finished
//                            {
//                              offline_proc = false;
//                              this.req_tree_state = "rts_idle";
//                              this.rts_ret_struct = ret_struct;
//                              eval(iparams_cp.cb_fct_call);                      
//                            }
//                          }
//                        }
//                        // Explorer path processing finished
//                        else
//                        {                
//                          this.req_tree_state = "rts_get_tree_items"; 
//                          T0_avail = false;                
//                                          // default : parent should be evaluated prior to actual elem
//                                          // (exception : when elem == locked_item)
//                          if (iparams_cp.elemId[0] != iparams_cp.lock_id)
//                          { 
//                            T0_avail = true;  
//                            ret_struct.tree_nodes[0].elem_id = ret_struct.explorer_path[0].elem_id;; 
//                            ret_struct.tree_nodes[0].gui_id = "E0";
//                          }
//                          if (((iparams_cp.mode == "load_all") || (iparams_cp.mode == "ticker_only")) && (iparams_cp.tickerIds.length > 0))
//                            req_elem_ids = iparams_cp.tickerIds[0];                                       
//                          else
//                            req_elem_ids = ret_struct.explorer_path[0].elem_id;  //iparams_cp.elemId[0]; //
//                      
//                          ret_struct.tree_nodes[0].elem_id = req_elem_ids;
//                        }
//                                          // delete whole offline_queue
//                        offline_queue.splice(0,offline_queue.length);
//                      }
        
// ###  ##################################################################################################################################
                      f_append_to_pad('div_panel4_pad','rts_get_explorer_path_call_do_get_tree');
                    }
                  }
                  else
                  {
                    f_append_to_pad('div_panel4_pad','rts_get_explorer_path_rxdata_bad');                      
                    alert("Get Tree Part (rts_get_explorer_path) : Data undefined");
                    this.req_elem_ids = [];               
                    this.req_tree_state = "rts_idle"; 
                  }
                }.bind(this))
                .fail(function() 
                {
                  f_append_to_pad('div_panel4_pad','rts_get_explorer_path_failed');                                        
                  alert("Get Tree Part (rts_get_explorer_path) : failed !");
                  this.req_elem_ids = [];                 
                  this.req_tree_state = "rts_idle";  
                }
              );
            }
            break;
        
          // ### part 2 : Tree Nodes
        
          // # get tree part from DB for Tree Display
          case "rts_get_tree_items" :
            this.req_tree_state = "wait_post_processing";          
            f_append_to_pad('div_panel4_pad','rts_get_tree_items');      
            if (this.req_elem_ids.length > 0)
            {
              // generate id param list for post
              var id_params = "";
              for (k=0; k<this.req_elem_ids.length; k++)
              {
                id_params = id_params + "ids[]=" + this.req_elem_ids[k];
                if (k<this.req_elem_ids.length-1)
                {
                  id_params = id_params + "&";
                } 
              }
              if (uc_browsing_change_permission == 1)
              {
                id_params = id_params + "&showDeleted=1";
              }
              f_append_to_pad('div_panel4_pad','rts_get_tree_items_before_post');                    
              // send post and handle responses
              $.post(this.data_src_path+"get?"+id_params, { })
                .done(function(data) {
                  f_append_to_pad('div_panel4_pad','rts_get_tree_items_after_post');                                      
                  // check if returned data is valid  
                  if (data != undefined)
                  {
                    f_append_to_pad('div_panel4_pad','rts_get_tree_items_rxdata_good');                                      

                    // check if there's at least one element
                    if (data.nodes.length > 0) {

                      // # local inits
//                      var my_item_ids_int = Object.keys(data);
                      var child_elem_ids = []; // to be filled with new child nodes
                      var local_is_deleted_arr = []; 
                      var local_parent_gui_id_arr = [];
                      var local_parent_elem_id_arr = [];
                      var is_multi = false;
                      // # traverse all loaded items
                      for (var k=0; k<this.req_elem_ids.length; k++)
                      {
                        this.rts_ret_struct.tree_nodes[this.new_item_offs] = {};                                         
                        this.rts_ret_struct.tree_nodes[this.new_item_offs].elem_id = this.req_elem_ids[k];
                        this.rts_ret_struct.tree_nodes[this.new_item_offs].gui_id = "T" + this.new_item_offs;      
                        this.rts_ret_struct.tree_nodes[this.new_item_offs].name = unescape(data.nodes[k].name); 
                        if (data.nodes[k].parents.length > 0)
                        {
                          data.nodes[k].parents = f_IntArr2StrArr(data.nodes[k].parents);
                          // $$$ HIER MUSS ETWAS GEMACHT WERDEN !!! $$$
                          this.rts_ret_struct.tree_nodes[this.new_item_offs].parent_elem_id = data.nodes[k].parents[0];
                        }
                        else
                        if (data.nodes[k].del_parents != undefined)
                        {
                          this.rts_ret_struct.tree_nodes[this.new_item_offs].parent_elem_id = data.nodes[k].del_parents[0];
                        }
                        if (this.rts_ret_struct.tree_nodes[this.new_item_offs].parent_elem_id == undefined)
                          this.rts_ret_struct.tree_nodes[this.new_item_offs].parent_elem_id = null;
                        var m=0;
                        while ((m<this.rts_ret_struct.tree_nodes.length) && (this.rts_ret_struct.tree_nodes[m].elem_id != data.nodes[k].parents[0])) {m++;}
                        if (m<this.rts_ret_struct.tree_nodes.length)
                          this.rts_ret_struct.tree_nodes[this.new_item_offs].parent_gui_id = this.rts_ret_struct.tree_nodes[m].gui_id; 
                        else
                          this.rts_ret_struct.tree_nodes[this.new_item_offs].parent_gui_id = null;
                        this.rts_ret_struct.tree_nodes[this.new_item_offs].isMultiPar = false;             
                        this.rts_ret_struct.tree_nodes[this.new_item_offs].description = unescape(data.nodes[k].content);     
                        this.rts_ret_struct.tree_nodes[this.new_item_offs].type = get_xtype("1", data.nodes[k].type);  
                        if (this.is_deleted_arr[k] == 1)
                        {
                          this.rts_ret_struct.tree_nodes[this.new_item_offs].is_deleted = 1;
                          this.rts_ret_struct.tree_nodes[this.new_item_offs].parent_gui_id = this.parent_gui_id_arr[k];
                          this.rts_ret_struct.tree_nodes[this.new_item_offs].parent_elem_id = this.parent_elem_id_arr[k];
                        }
                        this.rts_ret_struct.tree_nodes[this.new_item_offs].eval = c_EMPTY_EVAL_STRUCT;
                        child_elem_ids  = child_elem_ids.concat(data.nodes[k].children);
                        local_is_deleted_arr = local_is_deleted_arr.concat(new Array(data.nodes[k].children.length).fill(0));  
                        local_parent_gui_id_arr = local_parent_gui_id_arr.concat(new Array(data.nodes[k].children.length).fill(this.rts_ret_struct.tree_nodes[this.new_item_offs].gui_id));
                        local_parent_elem_id_arr = local_parent_elem_id_arr.concat(new Array(data.nodes[k].children.length).fill(this.rts_ret_struct.tree_nodes[this.new_item_offs].elem_id)); 
                        if (data.nodes[k].del_children != undefined)
                        {
                          child_elem_ids  = child_elem_ids.concat(data.nodes[k].del_children);
                          local_is_deleted_arr = local_is_deleted_arr.concat(new Array(data.nodes[k].del_children.length).fill(1));
                          local_parent_gui_id_arr = local_parent_gui_id_arr.concat(new Array(data.nodes[k].del_children.length).fill(this.rts_ret_struct.tree_nodes[this.new_item_offs].gui_id));
                          local_parent_elem_id_arr = local_parent_elem_id_arr.concat(new Array(data.nodes[k].del_children.length).fill(this.rts_ret_struct.tree_nodes[this.new_item_offs].elem_id)); 
                        }
                        this.new_item_offs++;
                      }           
                      child_elem_ids = f_IntArr2StrArr(child_elem_ids);
                      this.req_elem_ids = jQuery.extend(true, [], child_elem_ids);
                      this.is_deleted_arr = jQuery.extend(true, [], local_is_deleted_arr);
                      this.parent_gui_id_arr = jQuery.extend(true, [], local_parent_gui_id_arr);
                      this.parent_elem_id_arr = jQuery.extend(true, [], local_parent_elem_id_arr);
                      if (this.req_elem_ids.length != 0)
                      {
                                                              // ... and start next step
                        this.req_tree_state = "rts_get_tree_items";
                        do_get_tree(id+1);                      
                      }
                      else
                      {
                        this.req_tree_state = "rts_idle";  
                        f_append_to_pad('div_panel4_pad','Callback');    
                        eval(iparams_cp.cb_fct_call);                    
                      } 
        
//                      // multiple parents ? -> choose one depending on Cookie
//                      if (my_parent_ids.length > 1)
//                      {
//                                      // read from Cookie which parent item applies here
//                        my_parent_ids = this.get_multi_parents(elem_id, my_parent_ids);  
//                        is_multi = true;   
//                      }
//                      // Selected Item does not equal the Root Item
//                      if (this.new_item_offs > -1)                   
//                      {
//                        // # create current item
//                        ret_struct.explorer_path[this.new_item_offs] = {};                                         
//                        ret_struct.explorer_path[this.new_item_offs].elem_id = this.req_elem_ids[0][0];
//                        ret_struct.explorer_path[this.new_item_offs].gui_id = "E" + this.new_item_offs;      
//                        ret_struct.explorer_path[this.new_item_offs].name = data.name; 
//                        ret_struct.explorer_path[this.new_item_offs].parent_elem_id = my_parent_ids[0];
//                        ret_struct.explorer_path[this.new_item_offs].children_elem_id = data.children;
//                        ret_struct.explorer_path[this.new_item_offs].parent_gui_id = null; 
//                        ret_struct.explorer_path[this.new_item_offs].isMultiPar = is_multi;             
//                        // More parents above and no LockID in sight ? -> Go on with Explorer Path
//                        if ((parent_exists == true) && (my_parent_ids[0] != iparams_cp.lock_id))
//                        {
//                          ret_struct.explorer_path[this.new_item_offs].parent_gui_id = "E" + (this.new_item_offs+1);      
//                          this.level_ct++;
//                          this.new_item_offs = this.new_item_offs + 1; 
//                          this.req_elem_ids = [my_parent_ids[0]];
//                          this.req_tree_state = "rts_get_explorer_path";  
//                        }
//                        // no more parent items further up
//                        else
//                        {
//                          this.level_ct = 0;
//                          this.new_item_offs = 0;    
//                          this.req_elem_ids = ret_struct.explorer_path[0].children_elem_id;                          
//                          this.req_tree_state = "rts_get_tree_items";  
//                        }
//                      }
//                      // Root Item -> create first Tree Node
//                      else
//                      {
//                        var my_ref_type = "1";
//                        ret_struct.tree_nodes[0] = {};
//                        ret_struct.tree_nodes[0].elem_id = this.req_elem_ids[0][0];
//                        ret_struct.tree_nodes[0].gui_id = "T0";
//                        var my_name = data.name;
//                        if ((my_name == null) || (my_name == ""))
//                          my_name = unescape(data.content);                            
//                        ret_struct.tree_nodes[0].name = my_name;
//                        ret_struct.tree_nodes[0].description = unescape(data.content);     
//                        ret_struct.tree_nodes[0].type = get_xtype(my_ref_type, data.type); 
//                        ret_struct.tree_nodes[0].parent_elem_id = null;
//                        ret_struct.tree_nodes[0].parent_gui_id = null;
//                        ret_struct.tree_nodes[0].isMultiPar = false; 
//                        this.level_ct = 0;
//                        this.new_item_offs = 1;  
//                        this.req_elem_ids = data.children;
//                        this.req_tree_state = "rts_get_tree_items";
//                      }
        
        
//      
//      
//###   To be continued (much can be used from Explorer Path) ###
//                                      // get tree part including Content Objects
//              $.post(this.data_src_path+"get?ids[]="+req_elem_ids[0], { })
//                .done(function(data) {
//                  if (data != undefined)
//                  {
//                    this.req_tree_state = "rts_proc_tree_items";                  
//                    if (((iparams_cp.mode == "load_all") || (iparams_cp.mode == "ticker_only")) && (iparams_cp.tickerIds.length != 0))
//                    {
//                                      // create ticker itself ...
//                      ret_struct.ticker[ticker_len] = {};      
//                      ret_struct.ticker[ticker_len].elem_id = req_elem_ids[0];
//                      var my_name = data[req_elem_ids[0]].name;
//                      if (my_name == null)
//                        my_name = unescape(data[req_elem_ids[0]].content);                        
//                      ret_struct.ticker[ticker_len].name = my_name; 
//                                      // ... and its children
//                      ret_struct.ticker[ticker_len].text = " +++ ";                
//                      for (var i=0; i<data[req_elem_ids[0]].children.length; i++)
//                      {
//                        my_name = data[req_elem_ids[0]].children[i].name;
//                        if (my_name == null)
////                          my_name = "kein Titel";
//                          my_name = unescape(data[req_elem_ids[0]].children[i].content);                        
//                        ret_struct.ticker[ticker_len].text = ret_struct.ticker[ticker_len].text + my_name + " +++ ";
//                      }
//                      ticker_len++;
//                                      // prepare next run
//                      iparams_cp.tickerIds.splice(0,1);
//            
//                      if (iparams_cp.tickerIds.length > 0)
//                      {
//                                    // kill invalid ticker ids
//                        while (iparams_cp.tickerIds[0] == null)
//                        {
//                          ret_struct.ticker[ticker_len] = {};      
//                          ret_struct.ticker[ticker_len].elem_id = null;
//                          ret_struct.ticker[ticker_len].name = null;
//                          ret_struct.ticker[ticker_len++].text = null;
//                          iparams_cp.tickerIds.splice(0,1);
//                          if (iparams_cp.tickerIds.length == 0)
//                            break;
//                        }   
//                      }
//                      if (iparams_cp.tickerIds.length > 0)
//                      {
//                        this.req_tree_state = "rts_get_tree_items";
//                        req_elem_ids = iparams_cp.tickerIds[0];
//                      }
//                      else
//                      {
//                        if (iparams_cp.mode == "ticker_only")  // "ticker_only" finished
//                        {
//                          offline_proc = false;
//                          this.req_tree_state = "rts_idle";
//                          this.rts_ret_struct = ret_struct;
//                          eval(iparams_cp.cb_fct_call);                           
//                        }
//                        else
//                        {               
//                          this.req_tree_state = "rts_get_tree_items";
//                          req_elem_ids = ret_struct.explorer_path[0].elem_id;
//                          ret_struct.tree_nodes[0].elem_id = req_elem_ids;
//                        }
//                      }                      
//                      
//                    }
//                    else
//                    {
//                                        // put results into an offline processing queue
//                      offline_queue[0] = {};
//                      offline_queue[0] = jQuery.extend(true, {}, data[req_elem_ids[0]]);
                    }
                  }
                  else
                  {
                    f_append_to_pad('div_panel4_pad','rts_get_tree_items_rxdata_bad');                                                          
                    alert("Get Tree Part (rts_get_tree_items) : Data undefined");
                    this.req_elem_ids = [];               
                    this.req_tree_state = "rts_idle";  
                  }
                }.bind(this))
                .fail(function() {
                  f_append_to_pad('div_panel4_pad','rts_get_tree_items_failed');                                                                            
                  alert("Get Tree Part (rts_get_tree_items) : failed !");
                  this.req_elem_ids = [];
                  this.req_tree_state = "rts_idle";  
                }
              );
            }    
            break;
        
        
//          case "rts_proc_tree_items" :
//              if (offline_queue.length > 0)
//              {
//                // # local inits
//                var curr_item_offs = sibling_start+sibling_ct;
//                var is_multi = false;
//                                            
//                // # extract name of current item
//                var my_name = offline_queue[0].name;
//                if (my_name == null)
//                  my_name = unescape(offline_queue[0].content);   
//                // # extract type of current item
//                var my_ref_type = "1";
//                if (offline_queue[0].parents != undefined)
//                {           
//                  if (offline_queue[0].parents.length > 0)
//                  {
//                    // # save Default parent node to Cookie if multiple parents are available                                                                          
//                    if (offline_queue[0].parents.length > 1)
//                    {
//                      is_multi = true;
////                      this.default_parent_setup_obj.write(offline_queue[0].initData.Id, ret_struct.tree_nodes[curr_item_offs].parent_elem_id);
//                    }
//                    // # search for default parent object to get Reference Type                   
//                    var myRefersTo = offline_queue[0].parents; 
//                    for (var i=0; i<myRefersTo.length; i++)
//                    {
//                      if (ret_struct.tree_nodes[curr_item_offs].parent_elem_id == myRefersTo[i])
//                      {
////                        my_ref_type = myRefersTo[i].initData.ReferenceTypeId;
//                      }
//                    }
//                  }
//                }   
//                
//                if (ret_struct.tree_nodes[curr_item_offs].elem_id != offline_queue[0].Ids)
//                {
//                  alert("Shift between current index and current object!");
//                }
//                  
//                
//                // # update current tree item
//                if (this.global_setup.debugMode)
//                  ret_struct.tree_nodes[curr_item_offs].name = my_name +'('+my_ref_type+','+offline_queue[0].type+')';
//                else
//                  ret_struct.tree_nodes[curr_item_offs].name = my_name;
//                ret_struct.tree_nodes[curr_item_offs].description = unescape(offline_queue[0].content);
//                ret_struct.tree_nodes[curr_item_offs].type = get_xtype(my_ref_type, offline_queue[0].type);           
//                ret_struct.tree_nodes[curr_item_offs].isMultiPar = is_multi;
//        
//                // # Max. number of levels reached or no further child levels available ?
//                if ((this.level_ct >= this.global_setup.tree_max_child_depth) || (offline_queue[0].children == undefined))
//                {            
//                  this.req_tree_state = "rts_proc_tree_items";
//                } else 
//                if (offline_queue[0].children.length == 0)
//                {            
//                  this.req_tree_state = "rts_proc_tree_items";
//                } else 
//                // # Load boundary reached -> load further tree levels from database
//                if (offline_queue[0].children[0] == undefined)
//                {
//                  this.req_tree_state = "rts_get_tree_items";                                          
//                  req_elem_ids = offline_queue[0].Ids;
//                }  
//                // # add child nodes
//                else
//                {
//                  this.req_tree_state = "rts_proc_tree_items";
//                  var append_idx = offline_queue.length;
//                  for (var i=0; i<offline_queue[0].children.length; i++)
//                  {
//                    offline_queue[append_idx] = jQuery.extend(true, {}, offline_queue[0].children[i].initData.Referrer);
//                    ret_struct.tree_nodes[this.new_item_offs] = {};                            
//                    ret_struct.tree_nodes[this.new_item_offs].parent_elem_id = ret_struct.tree_nodes[curr_item_offs].elem_id;
//                    ret_struct.tree_nodes[this.new_item_offs].parent_gui_id = ret_struct.tree_nodes[curr_item_offs].gui_id;
//                    ret_struct.tree_nodes[this.new_item_offs].elem_id = offline_queue[0].initData.ReferredFrom[i].initData.ReferrerId; 
//                                    // correct gui_id of clicked Elem to make sure it is selected after loading
//                    if ((T0_avail == true) && (ret_struct.tree_nodes[this.new_item_offs].elem_id == iparams_cp.elemId[0]))             
//                    {
//                      T0_avail = false; 
//                      ret_struct.tree_nodes[this.new_item_offs].gui_id = "T0";
//                    }
//                    else             
//                      ret_struct.tree_nodes[this.new_item_offs].gui_id = "T" + this.new_item_offs;             
//                    this.new_item_offs++;
//                    children_len++;
//                    append_idx++;
//                  }
//                }
//      
//                // calculate what item is next
//                if (this.req_tree_state != "rts_get_tree_items")
//                {
//                  if (sibling_ct >= (sibling_len-1))
//                  {     
//                    sort(ret_struct.tree_nodes, sibling_start, sibling_len);
//                    this.level_ct++;         
//                  
//                    sibling_start = children_start; 
//                    sibling_len = children_len;   
//                    sibling_ct = 0;    
//                    children_start = this.new_item_offs;
//                    children_len = 0;  
//                  }
//                  else
//                  {
//                    sibling_ct++;
//                  }
//                  offline_queue.splice(0,1);              
//                }
//              }
//              else
//              {
//                offline_proc = false;
//                this.req_tree_state = "rts_idle";
//                                    // erase E0 from Tree Nodes if necessary and execute callback function
//                if (iparams_cp.elemId[0] != iparams_cp.lock_id)    
//                  ret_struct.tree_nodes.splice(0,1); 
//                this.rts_ret_struct = ret_struct;
//                eval(iparams_cp.cb_fct_call);                      
//              }
//              break;        
          case "rts_idle" :              
              break;
              
          default :
              f_append_to_pad('div_panel4_pad','Unknown case entry');                                                                    
              this.req_elem_ids = [];               
              this.req_tree_state = "rts_idle";   
              break;  
        } // switch (this.req_tree_state)
      }
      else
      {
        this.req_tree_state = "rts_idle";  
        f_append_to_pad('div_panel4_pad','Callback after empty list');    
        eval(iparams_cp.cb_fct_call);        
      }
      f_append_to_pad('div_panel4_pad','Stop#'+String(id));
//      alert('do_get_tree finished!');
    }.bind(this)   // var do_get_tree = function() 

    // actual sub-function call (first time without blocking wait for result)
    do_get_tree(0);
  }     // if (this.req_tree_state == "rts_idle")
  else
  {
    f_append_to_pad('div_panel4_pad','Get Tree already running - leaving !');        
//    alert("Get Tree already running !"); 
  }
  
  
}


function lib_data_paul_get_tree(iparams)
{
//  return JSON.parse("{\"fav\":[],\"ticker\":[],\"explorer_path\":[],\"tree_nodes\":[{\"parent_elem_id\":\"\",\"parent_gui_id\":\"\",\"elem_id\":\"1\",\"gui_id\":\"T0\",\"name\":\"aufWaren-/Personen-Austausch&rsaquo;\",\"type\":\"topic\",\"description\":\"\",\"eval\":[{\"avg\":0,\"num\":0},{\"avg\":0,\"num\":0},{\"avg\":0,\"num\":0}],\"isMultiPar\":false}]}");
  return this.rts_ret_struct;
}


function lib_data_paul_get_multi_parents(elem_id, my_parents)
{
  var parent_from_storage = this.defaultParentStorage.read(elem_id);
  if (parent_from_storage == undefined)
    return my_parents[0]; 
  else
    return parent_from_storage;   
}



// find out whether or not an item exists
function lib_data_paul_item_exists(itemId)
{
  alert("Paul : Item Exists not yet implemented");  
}
  
// create new tree item
function lib_data_paul_create_tree_item( iparams )  // iparams = {parent_elem_id, name, type, lock_id, cb_fctn_str}
{

  // create local copy of params
  var iparams_cp = jQuery.extend(true, {}, iparams);   
  var newId = null;

  //  URL example : .../create?parentnodeid=1&name=blau&type=general&authorid=1
  if (iparams_cp.parent_elem_id != undefined)
  {
    var post_params = "parentnodeid=" + iparams_cp.parent_elem_id;
    post_params = post_params + "&" + "name=" + escape(iparams_cp.name);
    post_params = post_params + "&" + "type=" + iparams_cp.type;  // general";    
    post_params = post_params + "&" + "authorid=1";

    $.post(this.data_src_path+"create?"+post_params, { })
      .done(function(data) {
        newId = data.id.toString();
        eval(iparams_cp.cb_fctn_str);
//        this.req_tree({elemId:[iparams_cp.parent_elem_id], lock_id:iparams_cp.lock_id, favIds:[], tickerIds:[], cb_fct_call:iparams_cp.cb_fctn_str, mode:"tree_only"});      
      }.bind(this))
      .fail(function() 
      {
        f_append_to_pad('div_panel4_pad','create_item failed');                                        
//        alert("create_item : failed !");
        this.req_elem_ids = [];                 
        this.req_tree_state = "rts_idle";  
      });
    
  }
  else
  {
    alert("Unknown Parameter parent_elem_id");
  }

  return newId;
}  
  
  
// delete item and all of its children
function lib_data_paul_delete_tree_item(iparams)          //  iparams = {parentId, itemId, lock_id, cb_fctn_str}
{  
  // create local copy of params
  var iparams_cp = jQuery.extend(true, {}, iparams);   

  //  old URL example : .../delete?id=10
  //  new URL example : .../deleteLink?id=5&parentid=1
  if (iparams_cp.itemId != undefined)
  {
    var post_params = "id=" + iparams_cp.itemId + "&parentid=" + iparams_cp.parentId;
    
    $.post(this.data_src_path+"deleteLink?"+post_params, { })
      .done(function(data) {
        this.req_tree({elemId:[iparams_cp.parentId], lock_id:iparams_cp.lock_id, favIds:[], tickerIds:[], cb_fct_call:iparams_cp.cb_fctn_str, mode:"tree_only"});        
      }.bind(this))
      .fail(function() 
      {
        f_append_to_pad('div_panel4_pad','delete_item failed');                                        
        this.req_elem_ids = [];                 
        this.req_tree_state = "rts_idle";  
      }
    );
  }
  else
  {
    alert("Unknown Parameter itemId");
  }
}

 
// get Item's parent nodes
function lib_data_paul_req_all_parents(iparams)
{  
  alert("Paul : Req All Parents not yet implemented");
}  


// get Item's parent nodes
function lib_data_paul_get_all_parents(itemId)
{
  return this.curr_item_parents; 
}

  
// cut&paste operations (later : for copy by reference) 
function lib_data_paul_copy_items(iparams)
{  
  // create local copy of params
  var iparams_cp = jQuery.extend(true, {}, iparams);   

  //  URL example : .../addLink?id[Kind-ID]&targetparentid=[...]
  if ((iparams_cp.src_elem[0].elem_id != undefined) && (iparams_cp.dst_elem.elem_id != undefined))
  {
    var post_params = "id=" + iparams_cp.src_elem[0].elem_id;
    post_params = post_params + "&targetparentid=" + iparams_cp.dst_elem.elem_id;
    
    $.post(this.data_src_path+"addLink?"+post_params, { })
      .done(function(data) {
        this.req_tree({elemId:[iparams_cp.dst_elem.elem_id], lock_id:iparams_cp.lock_id, favIds:[], tickerIds:[], cb_fct_call:iparams_cp.cb_fctn_str, mode:"tree_only"});
      }.bind(this))
      .fail(function() 
      {
        f_append_to_pad('div_panel4_pad','copy_item failed');                                        
        this.req_elem_ids = [];                 
        this.req_tree_state = "rts_idle";  
      }
    );
  }
  else
  {
    alert("copy_items : Incomplete Parameters");
  }
}


function lib_data_paul_clone_items(iparams)
{  
  // create local copy of params
  var iparams_cp = jQuery.extend(true, {}, iparams);   

  //  URL example : .../cloneNode?id=[Kind-ID]&targetparentid=[ID, unter der der Knoten eingefügt werden sollte]
  if ((iparams_cp.src_elem[0].elem_id != undefined) && (iparams_cp.dst_elem.elem_id != undefined))
  {
    var post_params = "id=" + iparams_cp.src_elem[0].elem_id;
    post_params = post_params + "&targetparentid=" + iparams_cp.dst_elem.elem_id;
    
    $.post(this.data_src_path+"cloneNode?"+post_params, { })
      .done(function(data) {
        this.req_tree({elemId:[iparams_cp.dst_elem.elem_id], lock_id:iparams_cp.lock_id, favIds:[], tickerIds:[], cb_fct_call:iparams_cp.cb_fctn_str, mode:"tree_only"});
      }.bind(this))
      .fail(function() 
      {
        f_append_to_pad('div_panel4_pad','clone_item failed');                                        
        this.req_elem_ids = [];                 
        this.req_tree_state = "rts_idle";  
      }
    );
  }
  else
  {
    alert("clone_items : Incomplete Parameters");
  }
}  


  
// cut&paste operations (later : for copy by reference) 
function lib_data_paul_move_items(iparams)  // iparams = {src_elem, dst_elem, old_parent_id, lock_id, cb_fctn_str}
{
  // create local copy of params
  var iparams_cp = jQuery.extend(true, {}, iparams);   

  //  URL example : .../moveLink?id=[Kind-ID]&oldparentid=[...]&newparentid=[...]
  if ((iparams_cp.src_elem[i].elem_id != undefined) && (iparams_cp.old_parent_id != undefined) && (iparams_cp.dst_elem.elem_id != undefined))
  {
    var post_params = "id=" + iparams_cp.src_elem[i].elem_id;
    post_params = post_params + "&oldparentid=" + iparams_cp.old_parent_id;
    post_params = post_params + "&newparentid=" + iparams_cp.dst_elem.elem_id;
    
    $.post(this.data_src_path+"moveLink?"+post_params, { })
      .done(function(data) 
      {
        this.req_tree({elemId:[iparams_cp.dst_elem.elem_id], lock_id:iparams_cp.lock_id, favIds:[], tickerIds:[], cb_fct_call:iparams_cp.cb_fctn_str, mode:"tree_only"});
      }.bind(this))
      .fail(function() 
      {
        f_append_to_pad('div_panel4_pad','move_item failed');                                        
        this.req_elem_ids = [];                 
        this.req_tree_state = "rts_idle";  
      }
    );
  }
  else
  {
    alert("move_items : Incomplete Parameters");
  }
}


  // field functions

// create fields of tree item
function lib_data_paul_create_tree_item_field(itemId, fieldId, content)
{
  alert("Paul : Create Tree Item Field not yet implemented");    
}  
  

// change fields of tree item                             
function lib_data_paul_change_tree_item_field(iparams) //  iparams = {items, field_id, content, lock_id, cb_fctn_str}
{  
  // create local copy of params
  var iparams_cp = jQuery.extend(true, {}, iparams);   

  //  URL example : .../update?id=7&name=yellow
  if (iparams_cp.items[0].elem_id != undefined)
  {
    var post_params = "id=" + iparams_cp.items[0].elem_id + "&" + iparams_cp.field_id + "=" + escape(iparams_cp.content);
    
    $.post(this.data_src_path+"update?"+post_params, { }, null, "text")
      .done(function(data) {
        this.req_tree({elemId:[iparams_cp.items[0].elem_id], lock_id:iparams_cp.lock_id, favIds:[], tickerIds:[], cb_fct_call:iparams_cp.cb_fctn_str, mode:"tree_only"});        
      }.bind(this))
      .fail(function() 
      {
        f_append_to_pad('div_panel4_pad','update_item failed');                                        
        this.req_elem_ids = [];                 
        this.req_tree_state = "rts_idle";  
      }
    );
  }
  else
  {
    alert("Unknown Parameter items");
  }
}


// get field content
function lib_data_paul_get_tree_item_field(itemId, fieldId)
{
  alert("Paul : Get Tree Item Field not yet implemented");    
}





function lib_data_disco_write_tree(iparams)
{
  alert("Write Tree not yet implemented");
}  


// auxiliary function of 'lib_data_disco_req_tree'
// works as ontology for the element types
function get_xtype(my_ref_type, my_post_type)
{
  // ... to Topic
  if ((my_ref_type == "1") || (my_post_type == "1"))  // ((my_ref_type == "Child") || (my_post_type == "Topic"))
    return c_LANG_LIB_TREE_ELEMTYPE[1][0];
  // ... to Fact
  if ((my_ref_type == "5") || (my_post_type == "5"))  // ((my_ref_type == "Evidence") || (my_post_type == "Information"))
    return c_LANG_LIB_TREE_ELEMTYPE[2][0];
  // ... to Pro-Arg
  if ((my_ref_type == "7"))                           // ((my_ref_type == "Agreement"))
    return c_LANG_LIB_TREE_ELEMTYPE[3][0];
  // ... to Contra-Arg
  if ((my_ref_type == "6") || (my_ref_type == "8"))   // ((my_ref_type == "Objection") || (my_ref_type == "Disagreement"))  
    return c_LANG_LIB_TREE_ELEMTYPE[4][0];
  // ... to Question
  if ((my_post_type == "3"))                          // ((my_post_type == "Question"))
    return c_LANG_LIB_TREE_ELEMTYPE[5][0];
  // ... to Problem 
  if ((my_post_type == "7"))                          // ((my_post_type == "Problem")) // (new)
    return c_LANG_LIB_TREE_ELEMTYPE[6][0];
  // ... to Idea
  if ((my_post_type == "4"))                          // ((my_post_type == "Proposal"))  
    return c_LANG_LIB_TREE_ELEMTYPE[7][0];
  // ... to Goal
  if ((my_post_type == "8"))                          // ((my_post_type == "Goal")) // (new)
    return c_LANG_LIB_TREE_ELEMTYPE[8][0];
//  // ... to Region (might be relevant later on)
  if ((my_post_type == "9"))                          // ((my_post_type == "Region")) // (new)
    return c_LANG_LIB_TREE_ELEMTYPE[9][0];
  // ... to Non-Typed
  return "Unknown";  
}





//################################################################################################
//### Item functions
//################################################################################################

function lib_data_disco_get_multi_parents(elem_id, my_parents)
{
  var parent_from_storage = this.default_parent_setup_obj.read(elem_id);
  if ((parent_from_storage == undefined) || (parent_from_storage == null))
    return [my_parents[0]]; 
  else
    return [parent_from_storage];   
}

// find out whether or not an item exists
function lib_data_disco_item_exists(itemId)
{
  var retval = true;
  discoContext.Posts.filter('it.Id == ' + itemId).toArray().then
  (
    function(response) 
    { 
      if (response.length == 0) 
        retval = false 
    }
  ).catch
  (
    function(response) 
    { 
      alert('Connection failed !'); 
    }
  );  
  
  return retVal;
}


function ontology_xtm2disco_post(xtm_type)
{
  switch (xtm_type)
  {
    case "topic"                        : return "1"; // "Topic";
    case "fact"                         : return "5"; // "Information";
    case "pro_arg"                      : return "2"; // "General";
    case "con_arg"                      : return "2"; // "General";
    case "question"                     : return "3"; // "Question";
    case "problem"                      : return "7"; // to be defined : "Problem";
    case "idea"                         : return "4"; // "Proposal";
    case "aim"                          : return "8"; // to be defined : "Goal";
    case "region"                       : return "9"; // to be defined : "Region";
    default                             : return "2"; // "General";
  }
}  

function ontology_xtm2disco_postref(xtm_type)
{
  switch (xtm_type)
  {
    case "topic"                        : return "1"; // "Child";
    case "fact"                         : return "5"; // "Evidence";
    case "pro_arg"                      : return "7"; // "Agreement";
    case "con_arg"                      : return "8"; // "Disagreement";
    case "question"                     : return "2"; // "General";
    case "problem"                      : return "2"; // "General";
    case "idea"                         : return "2"; // "General";
    case "aim"                          : return "2"; // "General";
    case "region"                       : return "2"; // "General";
    default                             : return "2"; // "General";    
  }
}  


// create new tree item
function lib_data_disco_create_tree_item( iparams )  // iparams = {parent_elem_id, name, type, lock_id, cb_fctn_str}
{
  var iparams_cp = jQuery.extend(true, {}, iparams);  
  
  var myContent = new Disco.Ontology.Content(); 
  var newId = undefined;
  myContent.Text = "";
  myContent.Title = iparams_cp.name;
  myContent.CultureId = "2";
  this.context.Content.add(myContent);                                    
  this.context.saveChanges().then
  (
    function(response)
    {
      var myPost = new Disco.Ontology.Post();
      myPost.PostTypeId = ontology_xtm2disco_post(iparams_cp.type);
      myPost.ContentId = myContent.Id;
      this.context.Posts.add(myPost);                                    
      this.context.saveChanges().then
      (
        function(response)
        {                     
          var myPostRef = new Disco.Ontology.PostReference();
          myPostRef.ReferrerId = myPost.Id;
          myPostRef.ReferreeId = iparams_cp.parent_elem_id;
          myPostRef.ReferenceTypeId = ontology_xtm2disco_postref(iparams_cp.type);
          this.context.PostReferences.add(myPostRef);                                    
          this.context.saveChanges().then
          (
            function(response)
            {
                                    // reload Tree
              this.req_tree({elemId:[iparams_cp.parent_elem_id], lock_id:iparams_cp.lock_id, favIds:[], tickerIds:[], cb_fct_call:iparams_cp.cb_fctn_str, mode:"tree_only"});
            }.bind(this)
          ).catch
          (
            function(response) 
            { 
              alert("Create PostRef failed !"); 
            }.bind(this)  
          );      
        }.bind(this)
      ).catch
      (
        function(response) 
        { 
          alert("Create Post failed !"); 
        }.bind(this)  
      );      
      
    }.bind(this)
  ).catch
  (
    function(response) 
    { 
      alert("Create Content failed !"); 
    }.bind(this)  
  );
}



// delete item and all of its children
function lib_data_disco_delete_tree_item(iparams)          //  iparams = {parentId, itemId, lock_id, cb_fctn_str}
{
  var iparams_cp = jQuery.extend(true, {}, iparams);  
                                    // check if last operation is already finished
  if (this.del_item_state == "di_idle")
  {
    // ########################################################################################
    var do_del_item = function() 
    {
      switch (this.del_item_state)
      {
        // ### Idle
        case "di_idle" :
        break;        
        // ### part 1 : erase link to parents
        case "di_cut_root_ref" :
                                    // get PostRefs to parent nodes for current target node
            this.context.PostReferences.filter('it.ReferrerId == '+iparams_cp.itemId[0]).toArray().then 
            (
              function(response) 
              {
                                    // find link to Default parent
                var i=0;
                while (i<response.length) 
                {
                  if (response[i].ReferreeId == iparams_cp.parentId)
                    break;                   
                  i++;
                }            
                                    // put current node into Processing FIFO
//                item_fifo[0] = {};
//                item_fifo[0].parentId = iparams_cp.parentId;
//                item_fifo[0].itemId = iparams_cp.itemId[0];
                                    // put PostRef to parent into Deletion FIFO
                item_parts2del[0] = {};
                item_parts2del[0].type = "PostRef";
                item_parts2del[0].id = response[i].Id;
                                    // prepare next step
                this.del_item_state = "di_del_item_parts"; 
                do_del_item.call(this);                           
              }.bind(this)
            ).catch
            (
              function(response) 
              { 
                this.del_item_state = "di_idle";                  
                alert('Get PostRef : Connection failed !'); 
              }.bind(this)
            );  
        break;    
        // ### part 2 : get info for current node
        case "di_get_info" :
            if (item_fifo.length > 0)
            {
              this.context.Posts.filter('it.Id == '+item_fifo[0].itemId).include('RefersTo').include('ReferredFrom').toArray().then
              (
                function(response) 
                {
                  item_parts2del = [];
                  var idx = 0;
                                    // current node is not linked to parents any more -> erase everything
                  if (response[0].RefersTo.length < 1)
                  {
                                    // traverse all child nodes
                    for (var k=0; k<response[0].ReferredFrom.length; k++)
                    {
                                    // put children into FIFO to check if they need to be erased, too
                      idx = item_fifo.length;
                      item_fifo[idx] = {};
                      item_fifo[idx].parentId = response[0].Id;
                      item_fifo[idx].itemId = response[0].ReferredFrom[k].ReferrerId;                       
                                    // put all child connections to erase list
                      idx = item_parts2del.length;
                      item_parts2del[idx] = {};                            
                      item_parts2del[idx].type = "PostRef";                
                      item_parts2del[idx].id = response[0].ReferredFrom[k].Id; 
                    }
                    // ################################################################################                    
                    // ### Current DISCO-Server doesn't support to delete Posts and Content Objects ###
                    // ################################################################################
                    // #                 // put post itself on erase list                             #
                    // # idx = item_parts2del.length;                                                 #
                    // # item_parts2del[idx] = {};                                                    #
                    // # item_parts2del[idx].type = "Post";                                           #
                    // # item_parts2del[idx].id = response[0].Id;                                     #
                    // #                 // put content on erase list                                 #
                    // # idx = item_parts2del.length;                                                 #
                    // # item_parts2del[idx] = {};                                                    #
                    // # item_parts2del[idx].type = "Content";                                        #
                    // # item_parts2del[idx].id = response[0].ContentId;                              #
                    // ################################################################################
                  }  
                                    // prepare next step
                  item_fifo.splice(0,1);                                    
                  this.del_item_state = "di_del_item_parts";                  
                  do_del_item.call(this);
                }.bind(this)
              ).catch
              (
                function(response) 
                { 
                  this.del_item_state = "di_idle";                  
                  alert('Get PostRef : Connection failed !'); 
                }.bind(this)
              );  
            }
            else
            {
              iparams_cp.itemId.splice(0,1); 
              if (iparams_cp.itemId.length > 0)
              {
                this.del_item_state = "di_cut_root_ref";
                do_del_item();
              }  
              else
              {
                this.del_item_state = "di_idle";         
                                      // reload tree after deletion
                this.req_tree({elemId:[iparams_cp.parentId], lock_id:iparams_cp.lock_id, favIds:[], tickerIds:[], cb_fct_call:iparams_cp.cb_fctn_str, mode:"tree_only"}); 
              }
            }
        break;
        // ### part 3 : deletion processing
        case "di_del_item_parts" :  
            if (item_parts2del.length > 0)
            {
              switch (item_parts2del[0].type)
              {
                case "Content" :      
                    this.context.Content.filter('it.Id == '+item_parts2del[0].id).toArray().then
                    (                                                                                                                    
                      function(response)                                                                                                 
                      {                                                                                                                  
                        this.context.Content.remove(response[0]);                                                                                             
                        this.context.saveChanges().then
                        (
                          function(response) 
                          {
                                      // erase first item in erasure list
                            item_parts2del.splice(0,1);                          
                                      // items left to erase ? -> continue
                            if (item_parts2del.length > 0)
                            {
                              this.del_item_state = "di_del_item_parts";                  
                            }
                                      // current item is finished -> any other nodes on Queue ?                          
                            else
                            {
                              this.del_item_state = "di_get_info";                    
                            }
                                      // next iteration
                            do_del_item.call(this);                          
                          }.bind(this)
                        ).catch
                        (
                          function(response) 
                          { 
                            this.del_item_state = "di_idle";
                            alert("Removing Content with Id : " + response[0].Id + " failed !"); 
                          }.bind(this)
                        );                
                      }.bind(this)
                    ).catch
                    (
                      function(response)                                                                                                 
                      {
                        this.del_item_state = "di_idle";
                        alert("Fetching Content with Id : " + response[0].Id + " failed !"); 
                      }.bind(this)
                    );
                break;
                case "Post" :
                    this.context.Posts.filter('it.Id == '+item_parts2del[0].id).toArray().then
                    (                                                                                                                    
                      function(response)                                                                                                 
                      {                                                                                                                  
                        this.context.Posts.remove(response[0]);                                                                                             
                        this.context.saveChanges().then
                        (
                          function(response) 
                          {
                                      // erase first item in erasure list
                            item_parts2del.splice(0,1);                          
                                      // items left to erase ? -> continue
                            if (item_parts2del.length > 0)
                            {
                              this.del_item_state = "di_del_item_parts";                  
                            }
                                      // current item is finished -> any other nodes on Queue ?                          
                            else
                            {
                              this.del_item_state = "di_get_info";                    
                            }
                                      // next iteration
                            do_del_item.call(this);                          
                          }.bind(this)
                        ).catch
                        (
                          function(response) 
                          { 
                            this.del_item_state = "di_idle";
                            alert("Removing Post with Id : " + response[0].Id + " failed !"); 
                          }.bind(this)
                        );                
                      }.bind(this)
                    ).catch
                    (
                      function(response)                                                                                                 
                      {
                        this.del_item_state = "di_idle";
                        alert("Fetching Post with Id : " + response[0].Id + " failed !"); 
                      }.bind(this)                                                                                                   
                    );
                break;
                case "PostRef" :
                    this.context.PostReferences.filter('it.Id == '+item_parts2del[0].id).toArray().then
                    (                                                                                                                    
                      function(response)                                                                                                 
                      {                                                                                                                  
                        this.context.PostReferences.remove(response[0]);                                                                                             
                        this.context.saveChanges().then
                        (
                          function(response) 
                          {
                                      // erase first item in erasure list
                            item_parts2del.splice(0,1);                          
                                      // items left to erase ? -> continue
                            if (item_parts2del.length > 0)
                            {
                              this.del_item_state = "di_del_item_parts";                  
                            }
                                      // current item is finished -> any other nodes on Queue ?                          
                            else
                            {
                              this.del_item_state = "di_get_info";                    
                            }
                                      // next iteration
                            do_del_item.call(this);                          
                          }.bind(this)
                        ).catch
                        (
                          function(response) 
                          { 
                            this.del_item_state = "di_idle";
                            alert("Removing PostRef with Id : " + response[0].Id + " failed !"); 
                          }.bind(this)
                        );                
                      }.bind(this)
                    ).catch
                    (
                      function(response)                                                                                                 
                      {
                        this.del_item_state = "di_idle";
                        alert("Fetching PostRef with Id : " + response[0].Id + " failed !"); 
                      }.bind(this)                                                                                                                  
                    );
                break; 
                default : 
                  alert("Unknown Object Type : \'" + item_parts2del[0].type + "\' Id : " + item_parts2del[0].id);
                break;
              } // switch 
            }
            else
            {
              this.del_item_state = "di_get_info";                    
              do_del_item.call(this);               
            }
        break;                      
        default : 
            this.del_item_state = "di_idle"; 
        break;  
      } // switch (this.req_tree_state)
    }.bind(this)   // var do_get_tree = function() 

    // ### first inits before any sub-function call
    var item_fifo = [];
    var item_parts2del = [];
    this.del_item_state = "di_cut_root_ref";
    // actual sub-function call (first time without blocking wait for result)
    do_del_item.call(this);
  }     // if (this.req_tree_state == "rts_idle")
  else
    alert("Del Tree already running !"); 
  
}


// get Item's parent nodes
function lib_data_disco_req_all_parents(iparams)
{
  this.context.Posts.filter('it.Id == '+iparams.elem_id)
    .include('RefersTo.Referree.Content')
    .toArray().then
  (                                                                                                                    
    function(response)                                                                                                 
    { 
      var myRefersTo = response[0].initData.RefersTo;
      this.curr_item_parents = [];
      for (var i=0; i<myRefersTo.length; i++)
      {
        this.curr_item_parents[i] = {};
        var my_parent_name = myRefersTo[i].initData.Referree.initData.Content.Title;
        if ((my_parent_name == null) || (my_parent_name == ""))
          my_parent_name = unescape(myRefersTo[i].initData.Referree.initData.Content.Text);        
        this.curr_item_parents[i].name = my_parent_name;
        this.curr_item_parents[i].elem_id = myRefersTo[i].initData.Referree.initData.Id;
      }
                                    // callback function
      eval(iparams.cb_fctn_str);
    }.bind(this)
  ).catch
  (
    function(response) 
    {
      alert("Connection to Database failed");
    }.bind(this)
  );
}


// get Item's parent nodes
function lib_data_disco_get_all_parents(itemId)
{
  return this.curr_item_parents; 
}


// cut&paste operations (later : for copy by reference) 
function lib_data_disco_copy_items(iparams)
{
                                    // copy by value
  var item_queue = jQuery.extend(true, [], iparams.src_elem);
  var myPostRef = new Disco.Ontology.PostReference();

  var do_copy = function() 
  {
    this.context.PostReferences.filter('it.ReferrerId == '+item_queue[0].elem_id).toArray().then
    (
      function(response)
      {
        var myPostRefTypeId= "";
        var already_exists = false;
        for (var i=0; i<response.length; i++)
        {
                                    // find original reference to copy the ref type, too
          if (response[i].ReferreeId == item_queue[0].parent_elem_id)
          {
            myPostRefTypeId = response[i].ReferenceTypeId;
          }
          if (response[i].ReferreeId == iparams.dst_elem.elem_id)
          {
            already_exists = true; 
          }
        }
        
        if (already_exists == false)
        {
          myPostRef = new Disco.Ontology.PostReference();
          myPostRef.ReferrerId = item_queue[0].elem_id;
          myPostRef.ReferreeId = iparams.dst_elem.elem_id;
          myPostRef.ReferenceTypeId = response[0].ReferenceTypeId;
          this.context.PostReferences.add(myPostRef);                                    
          this.context.saveChanges().then
          (
            function(response)
            {
                                          // erase first item in queue
              item_queue.splice(0,1);                          
                                          // items left ? -> continue
              if (item_queue.length > 0)
              {
                do_copy();                 
              }
                                          // finished -> reprint tree
              else
              {
                this.req_tree({elemId:[iparams.dst_elem.elem_id], lock_id:iparams.lock_id, favIds:[], tickerIds:[], cb_fct_call:iparams.cb_fctn_str, mode:"tree_only"});
              }        
            }.bind(this)
          ).catch
          (
            function(response)
            {
              alert("Copy failed !");
            }.bind(this)
          );
        }  
      }.bind(this)
    ).catch
    (
      function(response)
      {
        alert("GetPostRef of Copy failed !");
      }.bind(this)
    );
  }.bind(this)
  
  do_copy();     
}


// cut&paste operations (later : for copy by reference) 
function lib_data_disco_move_items(iparams)  // iparams = {src_elem, dst_elem, old_parent_id, lock_id, cb_fctn_str}
{
  if (this.move_item_state == "mis_idle")
  {
    this.move_item_state = "mis_new_parent";
                                    // copy by value
    var copy_queue = jQuery.extend(true, [], iparams.src_elem);
    var cut_queue = jQuery.extend(true, [], iparams.src_elem);       
    var myPostRef = new Disco.Ontology.PostReference();
    
    var do_move = function() 
    {
      switch (this.move_item_state)
      {
        case "mis_new_parent" : 
            myPostRef = new Disco.Ontology.PostReference();
            myPostRef.ReferrerId = copy_queue[0].elem_id;
            myPostRef.ReferreeId = iparams.dst_elem.elem_id;
            myPostRef.ReferenceTypeId = "1";
            this.context.PostReferences.add(myPostRef);                                    
            this.context.saveChanges().then
            (
              function(response)
              {
                                            // erase first item in queue
                copy_queue.splice(0,1);                          
                                            // no items left ? -> cut from old parent
                if (copy_queue.length <= 0)
                {
                  this.move_item_state = "mis_cut_from_old_parent";
                }
                do_move();                 
              }.bind(this)
            ).catch
            (
              function(response)
              {
                alert("Paste failed !");
              }.bind(this)
            );
        break;
        case "mis_cut_from_old_parent" : 
            this.context.PostReferences.filter('it.ReferrerId == '+cut_queue[0].elem_id).toArray().then 
            (
              function(response) 
              {
                                        // find old parent object among the results
                var i=0;
                while (i<response.length) 
                {
                  if (response[i].ReferreeId == iparams.old_parent_id)
                    break;                   
                  i++;
                }            
    
                                        // delete postref
                this.context.PostReferences.remove(response[i]);                                                                                             
                this.context.saveChanges().then
                (
                  function(response) 
                  { 
                                        // erase first item in queue
                    cut_queue.splice(0,1);                             
                                        // items left ? -> continue
                    if (cut_queue.length > 0)
                    {
                      do_move();                 
                    }
                                        // finished -> reprint tree
                    else
                    {
                      this.req_tree({elemId:[iparams.dst_elem.elem_id], lock_id:iparams.lock_id, favIds:[], tickerIds:[], cb_fct_call:iparams.cb_fctn_str, mode:"tree_only"});                       
                      this.move_item_state = "mis_idle";
                    }
                  }.bind(this)
                ).catch
                (
                  function(response)
                  {
                    alert("Erase of old Parent Ref failed !");
                  }.bind(this)
                );
              }.bind(this)
            ).catch
            (
              function(response)
              {
                alert("Cut failed !");
              }.bind(this)
            );
        break;
        default :
            this.move_item_state = "mis_idle";
        break;
      }
    }.bind(this)

    do_move();     
  }
}



//################################################################################################
//### Field functions
//################################################################################################

// create fields of tree item
function lib_data_disco_create_tree_item_field(itemId, fieldId, content)
{
}



// change fields of tree item                             
function lib_data_disco_change_tree_item_field(iparams) //  iparams = {items, field_id, content, lock_id, cb_fctn_str}
{
  switch (iparams.field_id)
  {
    case "name" : 
      if (iparams.items.length == 1)
      {
        this.context.Posts.filter('it.Id == '+iparams.items[0].elem_id).include('Content').toArray().then
        (                                                                                                                    
          function(response)                                                                                                 
          {                                                                                                                  
            this.context.Content.attach(response[0].Content);
            response[0].Content.Title = iparams.content;
            this.context.saveChanges().then
            (
              function(response) 
              {
                eval(iparams.cb_fctn_str);
//                this.req_tree({elemId:[iparams.items[0].elem_id], lock_id:iparams.lock_id, favIds:[], tickerIds:[], cb_fct_call:iparams.cb_fctn_str, mode:"tree_only"});
              }.bind(this)
            ).catch
            (
              function(response) 
              {
                alert("Content not changable");
              }.bind(this)
            );                
          }.bind(this)
        ).catch
        (
          function(response) 
          {
            alert("Post not found");
          }.bind(this)
        );
      }
      else                                                                                           
        alert("Error : More than one item selected!");
    break;
    case "type" :
                                    // true copy of items and other inits
      var item_queue = jQuery.extend(true, [], iparams.items);
      var ref_queue = [];
      var chng_type_state = "chng_type_post";
      
      var do_chng_type = function() 
      {
        switch (chng_type_state)
        {
                                    // change type of the Post itself
          case "chng_type_post" : 
                                    // fetch Post Object
            this.context.Posts.filter('it.Id == '+item_queue[0].elem_id).toArray().then
            (                                                                                                
              function(response)                                                                             
              {
                                    // apply changes
                this.context.Posts.attach(response[0]);
                response[0].PostTypeId = ontology_xtm2disco_post(iparams.content);
                this.context.saveChanges().then
                (
                  function(response) 
                  {
                                    // get Ids of Post References
                    this.context.PostReferences.filter('it.ReferrerId == '+item_queue[0].elem_id).toArray().then                    
                    (                                                                                                
                      function(response)                                                                             
                      {           
                        for (var i=0; i<response.length; i++)
                        {
                          ref_queue[i] = response[i].Id;
                        }
                                    // next step : change type of all parental Post Refs
                        chng_type_state = "chng_type_postref";
                        do_chng_type();
                      }.bind(this)
                    ).catch
                    (
                      function(response) 
                      {
                        alert("Post References not found");
                      }.bind(this)
                    );  
                  }.bind(this)
                ).catch
                (
                  function(response) 
                  {
                    alert("Post Type not changable");
                  }.bind(this)
                );                
              }.bind(this)
            ).catch
            (
              function(response) 
              {
                alert("Post not found");
              }.bind(this)
            );
          break;
          case "chng_type_postref" : 
            if (ref_queue.length > 0)
            {
                                    // fetch PostRef Object
              this.context.PostReferences.filter('it.Id == '+ref_queue[0]).toArray().then
              (                                                                                                
                function(response)                                                                             
                {
                                    // apply changes
                  this.context.PostReferences.attach(response[0]);
                  response[0].ReferenceTypeId = ontology_xtm2disco_postref(iparams.content);
                  this.context.saveChanges().then
                  (
                    function(response) 
                    {
                      ref_queue.splice(0,1);
                                    // other Post Refs to change ?
                      if (ref_queue.length > 0)
                      {
                        chng_type_state = "chng_type_postref";
                        do_chng_type();
                      }
                                    // other Items selected for change ?
                      else
                      {
                        item_queue.splice(0,1);  
                        if (item_queue.length > 0)
                        {
                          chng_type_state = "chng_type_post";
                          do_chng_type();
                        }
                        else
                        {
                          this.req_tree({elemId:[iparams.items[0].elem_id], lock_id:iparams.lock_id, favIds:[], tickerIds:[], cb_fct_call:iparams.cb_fctn_str, mode:"tree_only"});                      
                        }
                      }
                    }.bind(this)
                  ).catch
                  (
                    function(response) 
                    {
                      alert("PostRef type change failed");
                    }.bind(this)
                  );
                }.bind(this)
              ).catch
              (
                function(response) 
                {
                  alert("PostRef not found");
                }.bind(this)
              );    
            }
          break; 
          default :
            alert("Wrong FSM Type");
          break;
        }
      }.bind(this)
      do_chng_type();
    break;
    case "content" :
      if (iparams.items.length == 1)
      {
        this.context.Posts.filter('it.Id == '+iparams.items[0].elem_id).include('Content').toArray().then
        (                                                                                                                    
          function(response)                                                                                                 
          {                                                                                                                  
            this.context.Content.attach(response[0].Content);
            response[0].Content.Text = escape(iparams.content);
            this.context.saveChanges().then
            (
              function(response) 
              {
//                this.req_tree(iparams.items[0].elem_id, iparams.lock_id, iparams.cb_fctn_str);
              }.bind(this)
            ).catch
            (
              function(response) 
              {
                alert("Content not changable");
                this.req_tree({elemId:[iparams.items[0].elem_id], lock_id:iparams.lock_id, favIds:[], tickerIds:[], cb_fct_call:iparams.cb_fctn_str, mode:"tree_only"});                
              }.bind(this)
            );                
          }.bind(this)
        ).catch
        (
          function(response) 
          {
            alert("Post not found");
          }.bind(this)
        );
      }
      else                                                                                           
        alert("Error : More than one item selected!");
    break;    
    default :
      alert("Unknown Tree Item Field to change");
    break;
  }
}



// get field content
function lib_data_disco_get_tree_item_field(itemId, fieldId)
{
  return "";
}




// Bsp. für Peer-to-Perr :
// ========================
// Freenet
// Media Goblin
// https://de.wikipedia.org/wiki/Gnutella
// https://de.wikipedia.org/wiki/EDonkey2000
// https://de.wikipedia.org/wiki/FastTrack