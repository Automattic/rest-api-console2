<!DOCTYPE html>
<html lang="en">
<head>
    <title><?php the_title(); ?></title>
    <link rel="stylesheet" type="text/css" href="http://fonts.googleapis.com/css?family=Inconsolata:400,700|Open+Sans:300italic,400italic,600italic,400,300,600">
    <meta http-equiv="Content-Type" content="text/html, charset=utf-8">
    <?php wp_head(); ?>
    <!-- style + javascript -->
</head>
<body>
    <div id="path">
        <div id="auth" tabindex="2"></div>
        <div id="versions"></div>
        <div id="lookup-container">
            <div id="method"></div>
            <div id="parts"></div>
            <div id="search"><a></a></div>
            <div id="lookup"></div>
        </div>
        <div id="submit" tabindex="1"></div>
    </div>
    <section id="builder">
        <section id="parameters">
            <div id="query"></div>
            <div id="body" class="disabled"></div>
        </section>
        <section id="reference"></section>
    </section>
    <section id="requests"></section>
    <div id="tip">
        <div class="anchor"></div>
        <header>
            <code></code>
            <em></em>
        </header>
        <ul>
        </ul>
    </div>
    <?php wp_footer(); ?>
</body>
</html>