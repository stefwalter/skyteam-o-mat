<?php
/**
 * Plugin Name:       Skyteam-o-mat
 * Description:       Kurs-Finder wizard (modal on booking links, result in #bemerkungen).
 * Version:           0.1.2
 * Requires at least: 5.8
 * Requires PHP:      7.4
 * Author:            Skyteam
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       skyteam-o-mat
 *
 * @package Skyteam_O_Mat
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'SKYTEAM_O_MAT_VERSION', '0.1.2' );
define( 'SKYTEAM_O_MAT_PLUGIN_FILE', __FILE__ );
define( 'SKYTEAM_O_MAT_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'SKYTEAM_O_MAT_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

/**
 * Whether to register and enqueue the wizard script on this request.
 *
 * Default: front-end only (not admin, not login, not cron/CLI).
 * Narrow with: add_filter( 'skyteam_o_mat_enqueue_script', '__return_false' ); then enqueue manually.
 *
 * @param bool $load Whether to load.
 */
function skyteam_o_mat_should_enqueue() {
	if ( is_admin() ) {
		return false;
	}
	if ( wp_doing_cron() || ( defined( 'WP_CLI' ) && WP_CLI ) ) {
		return false;
	}
	// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited -- read-only check.
	if ( isset( $GLOBALS['pagenow'] ) && in_array( $GLOBALS['pagenow'], array( 'wp-login.php', 'wp-register.php' ), true ) ) {
		return false;
	}

	$script_rel = 'assets/skyteam-wizard.js';
	$path       = SKYTEAM_O_MAT_PLUGIN_DIR . $script_rel;
	if ( ! is_readable( $path ) ) {
		return false;
	}

	return (bool) apply_filters( 'skyteam_o_mat_enqueue_script', true );
}

/**
 * Register script handle (always when plugin loads, for manual enqueue).
 */
function skyteam_o_mat_register_script() {
	$script_rel = 'assets/skyteam-wizard.js';
	$path       = SKYTEAM_O_MAT_PLUGIN_DIR . $script_rel;
	$url        = SKYTEAM_O_MAT_PLUGIN_URL . $script_rel;

	if ( ! is_readable( $path ) ) {
		return;
	}

	wp_register_script(
		'skyteam-o-mat-wizard',
		$url,
		array(),
		SKYTEAM_O_MAT_VERSION . '.' . (string) filemtime( $path ),
		true
	);
}
add_action( 'init', 'skyteam_o_mat_register_script' );

/**
 * Enqueue on the front end when allowed.
 */
function skyteam_o_mat_enqueue_scripts() {
	if ( ! skyteam_o_mat_should_enqueue() ) {
		return;
	}
	if ( ! wp_script_is( 'skyteam-o-mat-wizard', 'registered' ) ) {
		return;
	}
	if ( wp_script_is( 'skyteam-o-mat-wizard', 'enqueued' ) ) {
		return;
	}
	wp_enqueue_script( 'skyteam-o-mat-wizard' );
}
add_action( 'wp_enqueue_scripts', 'skyteam_o_mat_enqueue_scripts', 20 );

/**
 * Optional shortcode: no visible output. Use when `skyteam_o_mat_enqueue_script` is false:
 * add the shortcode to the page (or a reusable block) so the script is enqueued from `wp_footer`.
 *
 * @param array<string,string> $atts Shortcode attributes (unused).
 * @return string
 */
function skyteam_o_mat_shortcode( $atts ) {
	$GLOBALS['skyteam_o_mat_shortcode_used'] = true;
	return '';
}
add_shortcode( 'skyteam_o_mat', 'skyteam_o_mat_shortcode' );

/**
 * Late enqueue when the shortcode appeared (after `wp_enqueue_scripts`).
 */
function skyteam_o_mat_footer_enqueue() {
	if ( empty( $GLOBALS['skyteam_o_mat_shortcode_used'] ) ) {
		return;
	}
	if ( ! wp_script_is( 'skyteam-o-mat-wizard', 'registered' ) ) {
		return;
	}
	wp_enqueue_script( 'skyteam-o-mat-wizard' );
}
add_action( 'wp_footer', 'skyteam_o_mat_footer_enqueue', 1 );

/**
 * Admin notice when the built bundle is missing (e.g. forgot `npm run build:wp`).
 */
function skyteam_o_mat_admin_notice_missing_bundle() {
	$path = SKYTEAM_O_MAT_PLUGIN_DIR . 'assets/skyteam-wizard.js';
	if ( is_readable( $path ) ) {
		return;
	}
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	echo '<div class="notice notice-warning"><p>';
	echo esc_html__(
		'Skyteam-o-mat: assets/skyteam-wizard.js is missing. From the project root run: npm run build:wp',
		'skyteam-o-mat'
	);
	echo '</p></div>';
}
add_action( 'admin_notices', 'skyteam_o_mat_admin_notice_missing_bundle' );
