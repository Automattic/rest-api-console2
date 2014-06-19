# Local npm bin directory
bin=`npm bin`

build=build

# Build output directory
dir=$build/wpcom-console

build_number=`git describe --always --tag --dirty`

# Cleanout contents of directory and make a fresh one
rm -r $build
mkdir -p $dir

# Copy public assets
cp -r public $dir

# Compile jade template
$bin/jade -O "{\"app_id\":\"$APP_ID\",\"build\":\"$build_number\"}" < views/index.html > $dir/public/index.html

# Complie browserify package
$bin/browserify lib/ui -o $dir/public/app.source.js
$bin/minify -o $dir/public/app.js $dir/public/app.source.js

tarfile=$build/wpcom-console.$build_number.tgz

# Tarball
tar czf $tarfile -C $build wpcom-console

echo "wpcom-console2 built at $tarfile"