<?php
/**
 * Plugin Name: REST API Console
 * Plugin URI:  http://wordpress.org/plugins/rest-api-console/
 * Description: A console for your REST API.
 * Version:     1
 * Author:      wordpressdotorg, automattic
 * Author URI:  http://wordpress.org/
 * License:     GPL v2 or later
 * Text Domain: rest-api-console
 * Domain Path: /language
 */

class WP_API_Console {

	public function __construct() {
		add_action( 'admin_menu', array( $this, 'admin_init' ) );
		add_action( 'load-tools_page_rest_api_console', array( $this, 'render' ) );
	}
	
	public function admin_init() {
		$hook = add_management_page( 'Rest API Console', 'Rest API Console', 'manage_options', 'rest_api_console', array( $this, 'nope' ) );
	}
	
	public function nope() {
	}
	
	public function render() {
		include( __DIR__ . '/templates/views/app.php' );
		exit;
	}
	
	
	static function instance() {
		static $instance = null;
		
		if ( is_null( $instance ) ) {
			$instance = new WP_API_Console();
		}
		
		return $instance;
	}
}


if ( is_admin() ) {
	WP_API_Console::instance();
}