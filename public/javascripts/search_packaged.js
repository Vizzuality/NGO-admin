(function($,undefined){$.widget("ui.autocomplete",{options:{appendTo:"body",delay:300,minLength:1,position:{my:"left top",at:"left bottom",collision:"none"},source:null,style:null},_create:function(){var self=this,doc=this.element[0].ownerDocument;this.element.addClass("ui-autocomplete-input").attr("autocomplete","off").attr({role:"textbox","aria-autocomplete":"list","aria-haspopup":"true"}).bind("keydown.autocomplete",function(event){if(self.options.disabled){return;}
var keyCode=$.ui.keyCode;switch(event.keyCode){case keyCode.PAGE_UP:self._move("previousPage",event);break;case keyCode.PAGE_DOWN:self._move("nextPage",event);break;case keyCode.UP:self._move("previous",event);event.preventDefault();break;case keyCode.DOWN:self._move("next",event);event.preventDefault();break;case keyCode.ENTER:case keyCode.NUMPAD_ENTER:if(self.menu.element.is(":visible")){event.preventDefault();}
case keyCode.TAB:if(!self.menu.active){return;}
self.menu.select(event);break;case keyCode.ESCAPE:self.element.val(self.term);self.close(event);break;default:clearTimeout(self.searching);self.searching=setTimeout(function(){if(self.term!=self.element.val()){self.selectedItem=null;self.search(null,event);}},self.options.delay);break;}}).bind("focus.autocomplete",function(){if(self.options.disabled){return;}
self.selectedItem=null;self.previous=self.element.val();}).bind("blur.autocomplete",function(event){if(self.options.disabled){return;}
clearTimeout(self.searching);self.closing=setTimeout(function(){self.close(event);self._change(event);},150);});this._initSource();this.response=function(){return self._response.apply(self,arguments);};this.menu=$("<ul></ul>").addClass("ui-autocomplete").addClass(this.options.style).appendTo($(this.options.appendTo||"body",doc)[0]).mousedown(function(event){var menuElement=self.menu.element[0];if(event.target===menuElement){setTimeout(function(){$(document).one('mousedown',function(event){if(event.target!==self.element[0]&&event.target!==menuElement&&!$.ui.contains(menuElement,event.target)){self.close();}});},1);}
setTimeout(function(){clearTimeout(self.closing);},13);}).menu({focus:function(event,ui){var item=ui.item.data("item.autocomplete");if(false!==self._trigger("focus",null,{item:item})){if(/^key/.test(event.originalEvent.type)){self.element.val(item.value);}}},selected:function(event,ui){var item=ui.item.data("item.autocomplete"),previous=self.previous;if(self.element[0]!==doc.activeElement){self.element.focus();self.previous=previous;}
if(false!==self._trigger("select",event,{item:item})){self.term=item.value;self.element.val(item.value);}
self.close(event);self.selectedItem=item;},blur:function(event,ui){if(self.menu.element.is(":visible")&&(self.element.val()!==self.term)){self.element.val(self.term);}}}).zIndex(this.element.zIndex()+1).css({top:0,left:0}).hide().data("menu");if($.fn.bgiframe){this.menu.element.bgiframe();}},destroy:function(){this.element.removeClass("ui-autocomplete-input").removeAttr("autocomplete").removeAttr("role").removeAttr("aria-autocomplete").removeAttr("aria-haspopup");this.menu.element.remove();$.Widget.prototype.destroy.call(this);},_setOption:function(key,value){$.Widget.prototype._setOption.apply(this,arguments);if(key==="source"){this._initSource();}
if(key==="appendTo"){this.menu.element.appendTo($(value||"body",this.element[0].ownerDocument)[0])}},_initSource:function(){var self=this,array,url;if($.isArray(this.options.source)){array=this.options.source;this.source=function(request,response){response($.ui.autocomplete.filter(array,request.term));};}else if(typeof this.options.source==="string"){url=this.options.source;this.source=function(request,response){if(self.xhr){self.xhr.abort();}
self.xhr=$.getJSON(url,request,function(data,status,xhr){if(xhr===self.xhr){response(data);}
self.xhr=null;});};}else{this.source=this.options.source;}},search:function(value,event){value=value!=null?value:this.element.val();this.term=this.element.val();if(value.length<this.options.minLength){return this.close(event);}
clearTimeout(this.closing);if(this._trigger("search")===false){return;}
return this._search(value);},_search:function(value){this.element.addClass("ui-autocomplete-loading");this.source({term:value},this.response);},_response:function(content){if(content.length){content=this._normalize(content);this._suggest(content);this._trigger("open");}else{this.close();}
this.element.removeClass("ui-autocomplete-loading");},close:function(event){if(($('span#tags_combo')[0]!=null)&&($('span#tags_combo').hasClass('active'))){$('span#tags_combo').removeClass('active');}
if(($('span#donor_name_input')[0]!=null)&&($('span#donor_name_input').hasClass('active'))){$('span#donor_name_input').removeClass('active');}
if(($('span.tags_site')[0]!=null)&&($('span.tags_site').hasClass('active'))){$('span.tags_site').removeClass('active');}
clearTimeout(this.closing);if(this.menu.element.is(":visible")){this._trigger("close",event);this.menu.element.hide();this.menu.deactivate();}},_change:function(event){if(this.previous!==this.element.val()){this._trigger("change",event,{item:this.selectedItem});}},_normalize:function(items){if(items.length&&items[0].label&&items[0].value){return items;}
return $.map(items,function(item){if(typeof item==="string"){return{label:item,value:item};}
return $.extend({label:item.label||item.value,value:item.value||item.label},item);});},_suggest:function(items){var ul=this.menu.element.empty().zIndex(this.element.zIndex()+1),menuWidth,textWidth;this._renderMenu(ul,items);this.menu.deactivate();this.menu.refresh();this.menu.element.show().position($.extend({of:this.element},this.options.position));menuWidth=ul.width("").outerWidth();textWidth=this.element.outerWidth();ul.outerWidth(Math.max(menuWidth,textWidth));},_renderMenu:function(ul,items){var self=this;$.each(items,function(index,item){self._renderItem(ul,item);});$('.ui-autocomplete').append('<li class="ui-menu-item last"></li>');},_renderItem:function(ul,item){if(this.options.style=='project_tags'){var count=item.label.split(" ")[1];var concept=item.label.split(" ")[2];return $("<li></li>").data("item.autocomplete",item).append($("<a></a>").text(item.label.split(" ")[0])).append($("<p class='info_amount'></p>").text(count+' '+concept)).appendTo(ul);}else{return $("<li></li>").data("item.autocomplete",item).append($("<a></a>").text(item.label)).appendTo(ul);}},_move:function(direction,event){if(!this.menu.element.is(":visible")){this.search(null,event);return;}
if(this.menu.first()&&/^previous/.test(direction)||this.menu.last()&&/^next/.test(direction)){this.element.val(this.term);this.menu.deactivate();return;}
this.menu[direction](event);},widget:function(){return this.menu.element;}});$.extend($.ui.autocomplete,{escapeRegex:function(value){return value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g,"\\$&");},filter:function(array,term){var matcher=new RegExp($.ui.autocomplete.escapeRegex(term),"i");return $.grep(array,function(value){return matcher.test(value.label||value.value||value);});}});}(jQuery));(function($){$.widget("ui.menu",{_create:function(){var self=this;this.element.addClass("ui-menu ui-widget u  i-widget-content ui-corner-all").attr({role:"listbox","aria-activedescendant":"ui-active-menuitem"}).click(function(event){if(!$(event.target).closest(".ui-menu-item a").length){return;}
event.preventDefault();self.select(event);});this.refresh();},refresh:function(){var self=this;var items=this.element.children("li:not(.ui-menu-item):has(a)").addClass("ui-menu-item").attr("role","menuitem");items.children("a").addClass("ui-corner-all").attr("tabindex",-1).mouseenter(function(event){self.activate(event,$(this).parent());}).mouseleave(function(){self.deactivate();});},activate:function(event,item){this.deactivate();if(this.hasScroll()){var offset=item.offset().top-this.element.offset().top,scroll=this.element.attr("scrollTop"),elementHeight=this.element.height();if(offset<0){this.element.attr("scrollTop",scroll+offset);}else if(offset>=elementHeight){this.element.attr("scrollTop",scroll+offset-elementHeight+item.height());}}
this.active=item.eq(0).children("a").addClass("ui-state-hover").attr("id","ui-active-menuitem").end();this._trigger("focus",event,{item:item});},deactivate:function(){if(!this.active){return;}
this.active.children("a").removeClass("ui-state-hover").removeAttr("id");this._trigger("blur");this.active=null;},next:function(event){this.move("next",".ui-menu-item:first",event);},previous:function(event){this.move("prev",".ui-menu-item:last",event);},first:function(){return this.active&&!this.active.prevAll(".ui-menu-item").length;},last:function(){return this.active&&!this.active.nextAll(".ui-menu-item").length;},move:function(direction,edge,event){if(!this.active){this.activate(event,this.element.children(edge));return;}
var next=this.active[direction+"All"](".ui-menu-item").eq(0);if(next.length){this.activate(event,next);}else{this.activate(event,this.element.children(edge));}},nextPage:function(event){if(this.hasScroll()){if(!this.active||this.last()){this.activate(event,this.element.children(":first"));return;}
var base=this.active.offset().top,height=this.element.height(),result=this.element.children("li").filter(function(){var close=$(this).offset().top-base-height+$(this).height();return close<10&&close>-10;});if(!result.length){result=this.element.children(":last");}
this.activate(event,result);}else{this.activate(event,this.element.children(!this.active||this.last()?":first":":last"));}},previousPage:function(event){if(this.hasScroll()){if(!this.active||this.first()){this.activate(event,this.element.children(":last"));return;}
var base=this.active.offset().top,height=this.element.height();result=this.element.children("li").filter(function(){var close=$(this).offset().top-base+height-$(this).height();return close<10&&close>-10;});if(!result.length){result=this.element.children(":first");}
this.activate(event,result);}else{this.activate(event,this.element.children(!this.active||this.first()?":last":":first"));}},hasScroll:function(){return this.element.height()<this.element.attr("scrollHeight");},select:function(event){this._trigger("selected",event,{item:this.active});}});}(jQuery));(function($){$('html').addClass('stylish-select');Array.prototype.indexOf=function(obj,start){for(var i=(start||0);i<this.length;i++){if(this[i]==obj){return i;}}}
$.fn.extend({getSetSSValue:function(value){if(value){$(this).val(value).change();return this;}else{return $(this).find(':selected').val();}},resetSS:function(){var oldOpts=$(this).data('ssOpts');$this=$(this);$this.next().remove();$this.unbind('.sSelect').sSelect(oldOpts);}});$.fn.sSelect=function(options){return this.each(function(){var defaults={defaultText:'Please select',animationSpeed:0,ddMaxHeight:'',containerClass:''};var opts=$.extend(defaults,options),$input=$(this),$containerDivText=$('<div class="selectedTxt"></div>'),$containerDiv=$('<div class="newListSelected '+opts.containerClass+'"></div>'),$newUl=$('<div class="newList_content '+opts.containerClass+'"><div class="wrapper"><ul class="newList scroll_pane '+opts.containerClass+'" style="visibility:hidden;"></ul></div></div>'),itemIndex=-1,currentIndex=-1,keys=[],prevKey=false,prevented=false,$newLi;$(this).data('ssOpts',options);$containerDiv.insertAfter($input);$containerDiv.attr("tabindex",$input.attr("tabindex")||"0");$containerDivText.prependTo($containerDiv);$newUl.appendTo($containerDiv);$input.hide();$containerDivText.data('ssReRender',!$containerDivText.is(':visible'));if($input.children('optgroup').length==0){$input.children().each(function(i){var option=$(this).html();var key=$(this).val();keys.push(option.charAt(0).toLowerCase());if($(this).attr('selected')==true){opts.defaultText=option;currentIndex=i;}
$newUl.find('ul.newList').append($('<li><a href="JavaScript:void(0);">'+option+'</a></li>').data('key',key));});$newLi=$newUl.find('ul.newList').children().children();}else{$input.children('optgroup').each(function(){var optionTitle=$(this).attr('label'),$optGroup=$('<li class="newListOptionTitle">'+optionTitle+'</li>');$optGroup.appendTo($newUl.find('ul.newList'));var $optGroupList=$('<ul></ul>');$optGroupList.appendTo($optGroup);$(this).children().each(function(){++itemIndex;var option=$(this).html();var key=$(this).val();keys.push(option.charAt(0).toLowerCase());if($(this).attr('selected')==true){opts.defaultText=option;currentIndex=itemIndex;}
$optGroupList.append($('<li><a href="JavaScript:void(0);">'+option+'</a></li>').data('key',key));})});$newLi=$newUl.find('ul li a');}
var newUlHeight=$newUl.find('ul.newList').height(),containerHeight=$containerDiv.height(),newLiLength=$newLi.length;if(currentIndex!=-1){navigateList(currentIndex,true);}else{$containerDivText.text(opts.defaultText);}
function newUlPos(){var containerPosY=$containerDiv.offset().top,docHeight=jQuery(window).height(),scrollTop=jQuery(window).scrollTop();if(newUlHeight>parseInt(opts.ddMaxHeight)){newUlHeight=parseInt(opts.ddMaxHeight);}
containerPosY=containerPosY-scrollTop;if(containerPosY+newUlHeight>=docHeight){$newUl.find('ul.newList').css({top:containerHeight+'px',height:newUlHeight});$input.onTop=true;}else{$newUl.find('ul.newList').css({top:'32px',height:newUlHeight});$input.onTop=false;}}
newUlPos();$(window).bind('resize.sSelect scroll.sSelect',newUlPos);function positionFix(){$containerDiv.css('position','relative');}
function positionHideFix(){$containerDiv.css('position','static');}
$containerDivText.bind('click.sSelect',function(event){event.stopPropagation();$(this).parent().toggleClass('opened');if($(this).data('ssReRender')){newUlHeight=$newUl.find('ul.newList').height('').height();containerHeight=$containerDiv.height();$(this).data('ssReRender',false);newUlPos();}
$('.newList').not($(this).next()).hide().parent().css('position','static').removeClass('newListSelFocus');$('div.newListSelected').each(function(){$(this).css('background-position','0 0');$(this).find('.newList_content').hide();$newUl.find('ul').css('display','none');$newUl.find('ul').css('visibility','hidden');});if($newUl.is(':hidden')){$newUl.show();$newUl.parent().children('div.selectedTxt').parent('div.newListSelected').css('background-position','0 -32px');$newUl.find('ul').css('display','inline');$newUl.find('ul').css('visibility','visible');$newUl.css('visibility','visible');var element=$newUl.parent().children('div.selectedTxt').parent('div.newListSelected').find('.scroll_pane');if((element!=undefined)&&(element.length>0)){var api=element.data('jsp');api.reinitialise();$newUl.parent().children('.newList_content').show();$newUl.css('visibility','visible');if(($('span#status_combo_search.clicked').length>0)||($('span#cluster_combo_search.clicked').length>0)||($('span#cluster_combo_search.clicked').length>0)||($('span#sector_combo_search.clicked').length>0)){$('span.clicked').removeClass('clicked');}}}else{$newUl.hide();}
positionFix();$newLi.eq(currentIndex).focus();});$newLi.bind('click.sSelect',function(e){$newUl.parent().children('div.selectedTxt').parent('div.newListSelected').css('background-position','0 0');var $clickedLi=$(e.target);currentIndex=$newLi.index($clickedLi);prevented=true;navigateList(currentIndex);$newUl.hide();$containerDiv.css('position','static');});$newLi.bind('mouseenter.sSelect',function(e){var $hoveredLi=$(e.target);$hoveredLi.addClass('newListHover');}).bind('mouseleave.sSelect',function(e){var $hoveredLi=$(e.target);$hoveredLi.removeClass('newListHover');});function navigateList(currentIndex,init){$newLi.removeClass('hiLite').eq(currentIndex).addClass('hiLite');if($newUl.is(':visible')){$newLi.eq(currentIndex).focus();}
var text=$newLi.eq(currentIndex).html();var val=$newLi.eq(currentIndex).parent().data('key');if(init==true){$input.val(val);if($containerDiv.hasClass('country_index')){text=text.substring(0,10)+'...';}
$containerDivText.text(text);return false;}
try{$input.val(val)}catch(ex){$input[0].selectedIndex=currentIndex;}
$input.change();if($containerDiv.hasClass('country_index')){text=text.substring(0,10)+'...';}
$containerDivText.text(text);}
$input.bind('change.sSelect',function(event){$targetInput=$(event.target);if(prevented==true){prevented=false;return false;}
$currentOpt=$targetInput.find(':selected');currentIndex=$targetInput.find('option').index($currentOpt);navigateList(currentIndex,true);});function keyPress(element){$(element).unbind('keydown.sSelect').bind('keydown.sSelect',function(e){var keycode=e.which;prevented=true;switch(keycode){case 40:case 39:incrementList();return false;break;case 38:case 37:decrementList();return false;break;case 33:case 36:gotoFirst();return false;break;case 34:case 35:gotoLast();return false;break;case 13:case 27:$newUl.hide();positionHideFix();return false;break;};keyPressed=String.fromCharCode(keycode).toLowerCase();var currentKeyIndex=keys.indexOf(keyPressed);if(typeof currentKeyIndex!='undefined'){++currentIndex;currentIndex=keys.indexOf(keyPressed,currentIndex);if(currentIndex==-1||currentIndex==null||prevKey!=keyPressed)currentIndex=keys.indexOf(keyPressed);navigateList(currentIndex);prevKey=keyPressed;return false;};});}
function incrementList(){if(currentIndex<(newLiLength-1)){++currentIndex;navigateList(currentIndex);}}
function decrementList(){if(currentIndex>0){--currentIndex;navigateList(currentIndex);}}
function gotoFirst(){currentIndex=0;navigateList(currentIndex);}
function gotoLast(){currentIndex=newLiLength-1;navigateList(currentIndex);}
$containerDiv.bind('click.sSelect',function(e){e.stopPropagation();keyPress(this);});$containerDiv.bind('focus.sSelect',function(){$(this).addClass('newListSelFocus');keyPress(this);});$containerDiv.bind('blur.sSelect',function(){$(this).removeClass('newListSelFocus');});$(document).bind('click.sSelect',function(){$containerDiv.removeClass('newListSelFocus');$newUl.hide();positionHideFix();$newUl.parent().children('div.selectedTxt').parent('div.newListSelected').css('background-position','0 0');$newUl.find('ul').css('display','none');$newUl.find('ul').css('visibility','hidden');});$containerDivText.bind('mouseenter.sSelect',function(e){var $hoveredTxt=$(e.target);$hoveredTxt.parent().addClass('newListSelHover');}).bind('mouseleave.sSelect',function(e){var $hoveredTxt=$(e.target);$hoveredTxt.parent().removeClass('newListSelHover');});$newUl.css({left:'0',display:'none',visibility:'visible'});});};})(jQuery);$(document).ready(function(){var autocomplete_offset;if($.browser.webkit||$.browser.opera){autocomplete_offset='0 0'}else if($.browser.mozilla){autocomplete_offset='1 0'};$('a.clear_date.start_date').click(function(evt){evt.preventDefault();$('select#date_start_month,select#date_start_year').val(null);$('form#search').submit();});$('a.clear_date.end_date').click(function(evt){evt.preventDefault();$('select#date_end_month,select#date_end_year').val(null);$('form#search').submit();});$('ul.filter_list li a.delete').live('click',function(evt){evt.preventDefault();var input_ids=$(this).closest('ul.filter_list').parent().find('input.ids');var ids=input_ids.val().split(',').removeByValue($(this).attr('rel'))
input_ids.val(ids.join(','))
$(this).parent().fadeOut(function(){$(this).remove();});$('form#search').submit();});$('input.autocomplete').each(function(index,element){$(element).data('data_class',$.trim($(element).closest('div.block').attr('class').replace('block','')));$(element).after($('<div/>').addClass('autocomplete-arrow').css({'position':'absolute','bottom':0,'right':12,'width':20,'height':20,'cursor':'pointer'}).bind('click',function(e){$(e.currentTarget).closest('.block').find('input').trigger('focus.autocomplete');})).autocomplete({'minLength':0,'position':{'offset':autocomplete_offset},'source':function(request,response){var data_class=$(this.element).data('data_class');filtered_items=$.grep(autocomplete_data[data_class],function(item,index){return item.title.match(new RegExp(request.term,"gi"));})
results=$.map(filtered_items,function(item,index){return item;});response(results);},'focus':function(event,ui){if(!ui||!ui.item){return;};return false;},'select':function(event,ui){if(!ui||!ui.item){return;};var data_class=$(this).data('data_class');var input_ids=$('input.'+data_class+'s.ids');var ids=[];if(input_ids.val()&&input_ids.val()!=''){ids=input_ids.val().split(',');};ids.push(ui.item.id);input_ids.val(ids.join(','));var label=ui.item.title;$(this).val(label);var a=$("."+data_class+" ul.filter_list li:last-child a").clone();if(a.length==0){a=$('<a>',{'href':'#'}).addClass('delete');$('<img>',{'src':'/images/sites/search/autocomplete_x.png','alt':'delete'}).load(function(){$(this).appendTo(a);a.attr('rel',ui.item.id);$("."+data_class+" ul.filter_list").append($("<li>",{"text":label}).append(a)).css('height',null);$(this).val('Add a '+(word_for[data_class]||data_class));$('form#search').submit();});}else{a.attr('rel',ui.item.id);$("."+data_class+" ul.filter_list").append($("<li>",{"text":label}).append(a)).css('height',null);$(this).val('Add a '+(word_for[data_class]||data_class));$('form#search').submit();};return false;},'open':function(event,ui){$(this).addClass('opened').autocomplete('widget').data('jsp',null).jScrollPane({autoReinitialise:false,showArrows:false,verticalGutter:5});},'close':function(event,ui){$(this).removeClass('opened');}}).data("autocomplete")._renderItem=function(ul,item){var
label
data_class=$(this.element).data('data_class');label='<a href="#" title="'+item.long_title+'">'+item.title+'</a>'
return $("<li></li>").data("item.autocomplete",item).append(label).appendTo(ul);};}).mouseup(function(evt){return false;}).focus(function(){$(this).select().autocomplete('search','');}).blur(function(){if(!$(this).val()||$(this).val()==''){$(this).val($(this).data('previous_value'));};});$('select#date_start_year').change(function(evt){$('form#search').submit();});$('select#date_start_month').change(function(evt){if($('select#date_start_month').val()&&$('select#date_start_year').val()){$('form#search').submit();};});$('select#date_end_year').change(function(evt){$('form#search').submit();});$('select#date_end_month').change(function(evt){if($('select#date_end_month').val()&&$('select#date_end_year').val()){$('form#search').submit();};});$('select#date_start_month').sSelect({ddMaxWidth:'107px',ddMaxHeight:'107px',containerClass:'month'});$('select#date_start_year').sSelect({ddMaxWidth:'63px',ddMaxHeight:'107px',containerClass:'year'});$('select#date_end_month').sSelect({ddMaxWidth:'107px',ddMaxHeight:'107px',containerClass:'month'});$('select#date_end_year').sSelect({ddMaxWidth:'63px',ddMaxHeight:'107px',containerClass:'year'});if($('.scroll_pane').length>0){$('.scroll_pane').jScrollPane({autoReinitialise:false,showArrows:false,verticalGutter:5});};});Array.prototype.removeByValue=function(val){for(var i=0;i<this.length;i++){if(this[i]==val){this.splice(i,1);break;}}
return this;};function resizeColumn(){}