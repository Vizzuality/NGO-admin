  $(document).ready(function(ev){
    fillCountries();
    function fillCountries() {
      $.getJSON('/admin/geolocations?level=0',function(result){
        var country_list = '<li><a id="country_0">Not specified</a></li>';
        for (var i=0; i<result.length; i++) {
          var li = '<li class="region_combo_item"><a id="'+ result[i].geolocation.uid +'" data-id="'+result[i].geolocation.id+'">'+result[i].geolocation.name+'</a></li>';
          country_list += li;
        }
        $('#country-list').jScrollPane({showArrows: false});

        var api = $('#country-list').data('jsp');
        api.getContentPane().children('li').remove();
        api.getContentPane().html(country_list);

        init();
      });

    }
    function init() {
        
      $('a#add_region_map').click(function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        $('div.region_window').fadeIn();
      });

      $('div.region_window a.close').click(function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        $('div.region_window').fadeOut(function(ev){
          resetRegionValues();
        });
      });


      $('span.region_combo').click(function(ev){
        ev.stopPropagation();
        ev.preventDefault();

        // Check if clicks in jscrollpane
        if (
          $(ev.target).hasClass('jspTrack') ||
          $(ev.target).hasClass('jspDrag')
        ) {
          return false;
        }

        if (!$(this).hasClass('clicked')){
          $('span.clicked').removeClass('clicked');
          $(this).addClass('clicked');
          resetCombo($(this));
        } else {
          $('span.clicked').removeClass('clicked');
          $(this).removeClass('clicked');
        }

        var me = $(this);

        $(document).click(function(event) {
          if ((!$(event.target).closest('span.region_combo').length)&&(!$(event.target).closest('.scroll_pane').length)) {
            me.removeClass('clicked');
          };
        });
      });
      $('.region_combo_item').click(clickHandlerForRegionItem);
      
      /* TEST */
      $("#test").on("change", clickHandlerForRegionItem);
      /* End test */


      $('#regions_list a.close').live('click',function (e){
        e.preventDefault();
        e.stopPropagation();
        var li = $(this).closest('li');
        removeCountryIsoCode(li.attr('data-country-id'));
        li.remove();
      });

      $('a#add_region_to_list').click(function (e){
          var i = 0;
          var countries_ids = [];
          var geolocation_ids = [];
          var countries_names = [];
          var regions_names = [];
          $('div.region_window div span.region_combo p').each(function(index,element){
            if ($(element).text()!="Not specified") {
              if(i == 0){
                var country_id   = $(element).data('id');
                updateCountryIsoCode(country_id);
                countries_ids.push(country_id);
                countries_names.push($(element).html());
              } else {
                geolocation_ids.push($(element).data('id'));
                regions_names.push($(element).html());
              }
            }
            i++;
          });

          if( geolocation_ids.length == 0 )
            $('#regions_list').append('<li data-country-id="'+countries_ids[0]+'"><p>'+countries_names[0]+'</p><input type="hidden" name="project[geolocation_ids][]" value="'+countries_ids[0]+'" /><a href="javascript:void(null)" class="close"></a></li>');
          else {
            var breadcrumb = [];
            breadcrumb.push(countries_names[0]);
            for(var i = 0;i<regions_names.length;i++) {
              breadcrumb.push(regions_names[i]);
            }
            $('#regions_list').append('<li data-country-id="'+countries_ids[0]+'"><p>'+breadcrumb.join(' > ')+'</p><input type="hidden" name="project[geolocation_ids][]" value="'+geolocation_ids[geolocation_ids.length - 1]+'" /><a href="javascript:void(null)" class="close"></a></li>');
          }

          e.preventDefault();
          e.stopPropagation();

          $('div.region_window').fadeOut(function(e){
            resetRegionValues();
          });
      });
    }

  });




  function resetRegionValues() {
    $('div.level_1').hide();
    $('div.level_2').hide();
    $('div.level_3').hide();

    $('div.region_window img.loader').hide();

    $('div.region_window div.bottom_region').prepend($('div.level_1'));
    $('div.region_window div.bottom_region').prepend($('div.level_0'));
    $('div.region_window div.bottom_region').prepend($('div.region_window p.info_region_exp'));
    $('div.region_window div.bottom_region').prepend($('div.region_window h3'));


    $('div.level_0 span p').attr('id','country_0');
    $('div.level_0 span p').text('Not specified');

    $('div.level_1 span p').attr('id','level1_0');
    $('div.level_1 span p').text('Not specified');

    $('div.level_2 span p').attr('id','level2_0');
    $('div.level_2 span p').text('Not specified');

    $('div.level_3 span p').attr('id','level3_0');
    $('div.level_3 span p').text('Not specified');
  }

  function clickHandlerForRegionItem(ev){
    
    var region_combo = $(this).closest('.region_combo');
    var new_item     = $(this).children('a');

    if (new_item.text().length>30) {
      region_combo.children('p').text(new_item.text().substr(0,27) + "...");
    } else {
      region_combo.children('p').text(new_item.text());
    }
    region_combo.children('p').data('id',new_item.data('id'));


    var item_level;
    var item_id;
    var next_element;


    //Get the block (level 1,2,3 or country)
    if (region_combo.parent().hasClass('level_0')) {
      item_level = 1;
      item_id = new_item.attr('id');
      next_element = $('div.level_1');

      $('div.level_1').children('span.region_combo').children('p').text('Not specified');
      $('div.level_1').children('span.region_combo').children('p').attr('id',item_level+'_0');

      $('div.level_1').hide();
      $('div.level_2').hide();
      $('div.level_3').hide();

    } else if (region_combo.parent().hasClass('level_1')) {
      item_level = 2;
      item_id = new_item.attr('id');
      next_element = $('div.level_2');

      $('div.level_2').children('span.region_combo').children('p').text('Not specified');
      $('div.level_2').children('span.region_combo').children('p').attr('id',item_level+'_0');

      $('div.level_2').hide();
      $('div.level_3').hide();

    } else if (region_combo.parent().hasClass('level_2')) {
      item_level = 3;
      item_id = new_item.attr('id');
      next_element = $('div.level_3');

      $('div.level_3').children('span.region_combo').children('p').text('Not specified');
      $('div.level_3').children('span.region_combo').children('p').attr('id',item_level+'_0');

      $('div.level_3').hide();

    } else {
      region_combo.removeClass('clicked');
      return false;
    }


    region_combo.parent().find('img.loader').show();


    //If not specified - hide nexts fields, else
    if (new_item.text()=="Not specified") {
      $('img.loader').hide();
      if (item_level==1) {
        $('div.region_window div.bottom_region').prepend($('div.level_1'));
        $('div.region_window div.bottom_region').prepend($('div.level_0'));
        $('div.region_window div.bottom_region').prepend($('div.region_window p.info_region_exp'));
        $('div.region_window div.bottom_region').prepend($('div.region_window h3'));
      } else if (item_level==2) {
        $('div.region_window div.bottom_region').prepend($('div.level_1'));
        $('div.region_window div.bottom_region').prepend($('div.level_0'));
      } else if (item_level==3){
        $('div.region_window div.top_region').append($('div.level_0'));
        $('div.region_window div.bottom_region').prepend($('div.level_1'));
      } else {
        $('div.region_window div.bottom_region').prepend($('div.region_window p.info_region_exp'));
        $('div.region_window div.bottom_region').prepend($('div.region_window h3'));
      }
    } else {
      if ($('#project_geographical_scope').val() === 'specific_locations') {
        $.getJSON('/admin/geolocations?level='+item_level+'&geolocation='+item_id,function(result){
          if (!!result.length) {
            var settings = {showArrows: false};
            var pane = next_element.children('span.region_combo').children('div.wrapper').children('ul.scroll_pane')
            pane.jScrollPane(settings);
            var api = pane.data('jsp');
            api.getContentPane().children('li').remove();
            api.getContentPane().append('<li class="region_combo_item"><a id="level'+ item_level + '_0">Not specified</a></li>');
            for (var i=0; i<result.length; i++) {
              var li = $('<li class="region_combo_item"><a id="'+result[i].geolocation.uid +'" data-id="'+result[i].geolocation.id+'">'+result[i].geolocation.name+'</a></li>');
              li.click(clickHandlerForRegionItem);
              api.getContentPane().append(li);
            }
            api.getContentPane().append('<li class="last"></li>');


            if (item_level==1) {
              $('div.region_window div.bottom_region').prepend($('div.level_0'));
              $('div.region_window div.top_region').append($('div.region_window h3'));
              $('div.region_window div.top_region').append($('div.region_window p.info_region_exp'));
            } else if (item_level==2) {
              $('div.region_window div.bottom_region').prepend($('div.level_1'));
              $('div.region_window div.top_region').append($('div.region_window h3'));
              $('div.region_window div.top_region').append($('div.region_window p.info_region_exp'));
              $('div.region_window div.top_region').append($('div.level_0'));
            } else {
              $('div.region_window div.top_region').append($('div.region_window h3'));
              $('div.region_window div.top_region').append($('div.region_window p.info_region_exp'));
              $('div.region_window div.top_region').append($('div.level_0'));
              $('div.region_window div.top_region').append($('div.level_1'));
            }
            next_element.show();
          }

          $('img.loader').hide();
        });
      } else {
        $('img.loader').hide();
      }
    }
  }
