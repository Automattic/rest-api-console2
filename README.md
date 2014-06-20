# Console2

A better REST console. [See it in action][].

[See it in action]: http://beaucollins.github.io/wpcom-console2

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

# Configure

Visit [WordPress.com Developer Resources][wpcomdev] and create an application.

Copy `config.sample.json` to `config.json` and use your WordPress.com App ID and Redirect URI for the values.

You will also need to add your host to the CORS whitelist in the Application's settings.

[wpcomdev]: https://developer.wordpress.com/

## Building

To create a static package you can use anywhere (e.g. Github pages):

    npm run build

The file generated site contents is located in `build/wpcom-console/public` along with a tarball.
