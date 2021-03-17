module.exports = function (app) {

    var db = app.get("db")

    if (!db.bspoke) {
        db.run(`CREATE TABLE bspoke 
            (id bigserial primary key,
            id_user bigint,
            email char(200),
            username char(20),
            product char(20),
            lastprice char(20),
            lastpaid timestamp,
            expires timestamp,
            verified boolean default false,
            deleted boolean default false,
            datetime timestamp not null default current_timestamp,
            other jsonb)`, (err,res) => {
                console.log(err, res)
            })
    }

    var getStatus = function (id_user, product, callback) {
        db.bspoke.where("id_user=$1 AND product=$2", [id_user, product], (err,res) => {
            callback(err, res)
        })
    }


    app.get('/apps/bspoke/status', function (req, res) {
        if (!req.user || !req.query.product) {
            return res.send({})
        }

        getStatus(req.user.id, req.query.product, (err, res) => {
            res.send(err || res)    
        })
    });
    
    app.get('/apps/bspoke/admin/status', function (req, res) {
        if (!req.user || !req.user.admin) {
            return res.send({})
        }

        db.bspoke.find({}, (err, results) => {
            res.send(err || results)    
        })
    });

    app.post('/apps/bspoke/start_music_room_trial', function (req, res) {
        if (!req.user) {
            return res.send({})
        }

        var product = "musicroom"

        // see if we're already started
        getStatus(req.user.id, product, (err, results) => {
            if (results.length > 0) {
                return res.send({err:"trial record exists"})
            }

            if (!req.body.email) {
                return res.send({err:"no email"})
            }

            var now = new Date()
            var twoWeeks = new Date()
            twoWeeks.setDate(now.getDate() + 2 * 7);

            db.bspoke.insert({
                id_user: req.user.id, 
                product: product,
                lastpaid: now,
                lastprice: 0,
                email: req.body.email,
                username: req.body.username,
                expires: twoWeeks

            }, (err, results) => {

                // give the user upload space
                db.users.save({id: req.user.id, upload_limit: 100000000}, function (err, saveResult) {
                    
                });
                res.send(err || results)
            })

        })
    }); 
}