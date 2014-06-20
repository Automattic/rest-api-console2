# Local npm bin directory
bin=`npm bin`


build=build

log=$build/build.log

# Build output directory
dir=$build/wpcom-console

build_number=`git describe --always --tag --long --dirty`
version=`$bin/json -f package.json version`

# Cleanout contents of directory and make a fresh one
rm -r $build
mkdir -p $dir

# Copy public assets
cp -r public $dir

# Compile jade template
config=$($bin/json -f config.json -e "this.build=\"$build_number\"; this.version=\"$version\"")
configString=$(node -e "process.stdout.write(JSON.stringify($config).replace(/\"/g,\"\\\"\"));")
echo "Config $configString"

$bin/jade -O $configString  < templates/views/app.jade > $dir/public/index.html

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