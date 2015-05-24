# Console2

A better REST console. [See it in action][].

[See it in action]: http://developer.wordpress.com/api/console/

## Development

Hacking requires node.js, install node.js for your system. (e.g. `brew install node`).

To get up and running:

1. Clone the repository
    `git clone https://github.com/beaucollins/wpcom-console2.git`

2. Install dependencies
    `npm install`

3. Run the dev server
    `npm start`

Visit [http://localhost:4000](http://localhost:4000) in your browser.

**Tip**: You can change the port using the `PORT` environment variable:

    sudo PORT=80 npm start

WordPress.com's App settings do not allow CORS URI's with ports in them.

## Configure

Visit [WordPress.com Developer Resources][wpcomdev] and create an application.

Copy `config.sample.json` to `config.json` and use your WordPress.com App ID and Redirect URI for the values.

You will also need to add your host to the CORS whitelist in the Application's settings.

[wpcomdev]: https://developer.wordpress.com/

## Building

To create a static package you can use anywhere (e.g. Github pages):

    npm run build

The static site is located in `build/dist/wpcom-console/public` along with a tarball.


## License

The REST API console is licensed under the
[GPL version 2 or later](http://www.gnu.org/licenses/gpl-2.0.html).

This project uses code from the following projects:

* [REST API Console2][console2] by Automattic: Licensed under the MIT open
  source license.

(Full license information available in the [LICENSE](./LICENSE) file.)

[console2]: https://github.com/Automattic/rest-api-console2
