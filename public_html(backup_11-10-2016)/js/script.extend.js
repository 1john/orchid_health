$('.expand-details').on('click', function(){
    var $this = $(this);
    $this.closest('.team-container').toggleClass('expanded');

    if($this.html() === 'Read More   +'){
        $this.html('Read Less   X');
    }else{
        $this.html('Read More   +');
    }
        //return text === "PUSH ME" ? "DON'T PUSH ME" : "PUSH ME";
});


var service = $("#services");

if(service.length){
    function equalizeHeight(){
        var maxHeight = -1;

        $('.service-box').each(function() {
            maxHeight = maxHeight > $(this).height() ? maxHeight : $(this).height();
        });

        $('.service-box').each(function() {
            $(this).height(maxHeight);
        });
        maxHeight = -1;
    }

    $(window).resize(function(){
        setTimeout(function() {
            equalizeHeight();
        }, 300);
        setTimeout(function() {
            equalizeHeight();
        }, 2000);
    });

    $(window).load(function(){
        setTimeout(function() {
            equalizeHeight();
        }, 300);
    });

}
