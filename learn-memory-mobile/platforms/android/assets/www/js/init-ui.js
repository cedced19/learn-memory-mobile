(function ($) {
    var body = $('body');

    $('#header__icon').click(function (e) {
        e.preventDefault();
        body.toggleClass('with--sidebar');
    });

    $('#site-cache').click(function () {
        body.removeClass('with--sidebar');
    });

    $('.menu > a').click(function () {
        body.removeClass('with--sidebar');
    });
    
})(jQuery);