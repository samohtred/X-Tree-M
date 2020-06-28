function uc_browsing_is_loop(tree_part, dest_item, src_items)
{
  var retval = false; 
  
  for (var i=0; i<src_items.length; i++)
  {
    for (var j=0; j<tree_part.explorer_path.length; j++)
    {
      if (src_items[i].elem_id == tree_part.explorer_path[j].elem_id)
        retval = true;
    }
    if (src_items[i].elem_id == dest_item.elem_id)
      retval = true; 
  }
  return retval;
}