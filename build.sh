# Local npm bin directory
bin=`npm bin`


build=build

log=$build/build.log

# Build output directory
dir=$build/wpcom-console

build_number=`git describe --always --tag --dirty`

# Cleanout contents of directory and make a fresh one
rm -r $build
mkdir -p $dir

# Copy public assets
cp -r public $dir

# Compile jade template
$bin/jade -O "{\"app_id\":\"$APP_ID\",\"build\":\"$build_number\"}" < templates/views/index.html > $dir/public/index.html 2>> $log

# Compile sass template
$bin/node-sass --output-style=compressed templates/sass/style.scss $dir/public/style.css 2>> $log 1>> $log

# Compile browserify package
$bin/browserify lib/ui -o $dir/public/app.source.js 2>> $log 1>> $log
# Minify app js
$bin/minify -o $dir/public/app.js $dir/public/app.source.js 2>> $log 1>> $log
# Remove
rm $dir/public/app.source.js

tarfile=$build/wpcom-console.$build_number.tgz

# Tarball
tar cvzf $tarfile -C $build wpcom-console 1>> $log 2>> $log

echo "wpcom-console2 built at $tarfile"