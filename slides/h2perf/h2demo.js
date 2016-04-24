Reveal.addEventListener('h2demo', function (e) {
    var base = $("[data-state='"+e.type+"']",e.currentTarget).get(0);

    $('div.btn',base).click(function (e) {
        e.preventDefault();

        var url = $(this).data('url');
        var iframe = $('iframe',base);

        iframe.attr('src',url);
        $('div.btn',base).removeClass('active');
        $(this).addClass('active');
        $('[data-container="metrics"] .metric-value').text("-")
    });

   window.addEventListener('message',function (msg) {
       var metrics = msg.data;
       $('[data-container="metrics"]').html(
           metrics.map(function (m) {
               return "<div class='metric'>" +
               "<div class='metric-name'>"+m.name+"</div>" +
               "<div class='metric-value'>"+m.value+"</div>" +
               "</div>";
           }).join("")
       )
   },false)
})

