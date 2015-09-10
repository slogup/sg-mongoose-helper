
const STATE = {
    FAIL: 'fail',
    SUCCESS: 'success',
    ERROR: 'error'
};

function errorHandler(err) {

    console.error(err);
    var ret;
    if (err.code === 11000 || err.code === 11001 ||
        (err.name === 'MongoError' && err['lastErrorObject'] && err['lastErrorObject'].code === 11000) ||
        (err.name === 'MongoError' && err['lastErrorObject'] && err['lastErrorObject'].code === 11001)) {

        ret = {
            status: 409,
            state: STATE.FAIL,
            data: err
        };
    }
    else if (err.name === 'ValidationError') {
        ret = {
            status: 400,
            state: STATE.FAIL,
            data: err
        };
    }
    else if (err.name == 'CastError') {
        ret = {
            status: 400,
            state: STATE.FAIL,
            data: err
        };
    }
    else {
        ret = {
            status: 500,
            state: STATE.ERROR,
            data: err
        };
    }
    return ret;
}

function callbackForFindMethod(model, callback){
    return function(err, data){

        var ret;
        if (err) ret = errorHandler(err);
        else {
            if ((!Array.isArray(data) && data) || (Array.isArray(data) && data.length > 0)) {
                ret = {
                    status: 200,
                    state: STATE.SUCCESS,
                    data: data
                };
            }
            else {
                ret = {
                    status: 404,
                    state: STATE.FAIL
                };
            }
        }
        return callback(ret);
    };
}

var crudHelper = {

    findOne : function(aModel, aSelector, aFields, aOptions, aCallback, aPopulations, aSlice, aDistinct){

        var chain = aModel.findOne(aSelector,aFields,aOptions);
        if (aPopulations) chain = chain.populate(aPopulations);
        if (aSlice) {
            for(var k in aSlice){
                chain = chain.slice(k, aSlice[k]);
            }
        }
        if (aDistinct) chain.distinct(aDistinct, callbackForFindMethod(aModel, aCallback));
        else chain.exec(callbackForFindMethod(aModel, aCallback));
    },
    find : function(aModel, aSelector, aFields, aOptions, aCallback, aPopulations, aSlice, aDistinct) {

        var chain = aModel.find(aSelector,aFields,aOptions);
        if (aPopulations) chain = chain.populate(aPopulations);
        if (aSlice) {
            for (var k in aSlice) {
                chain = chain.slice(k, aSlice[k]);
            }
        }
        if (aDistinct) chain.distinct(aDistinct, callbackForFindMethod(aModel, aCallback));
        else chain.exec(callbackForFindMethod(aModel, aCallback));
    },
    create : function(aModel, aUpdate, aCallback) {

        aModel.create(aUpdate, function(err) {
            var ret;

            if (err) ret = errorHandler(err);
            else {
                ret = {
                    status: 201,
                    state: STATE.SUCCESS
                };
            }

            aCallback(ret);

        });
    },
    remove : function(aModel, aSelector, aCallback) {
        aModel.remove(aSelector, function(err) {
            var ret;

            if (err) ret = errorHandler(err);
            else {
                ret = {
                    code: 204,
                    state: STATE.SUCCESS
                };
            }

            aCallback(ret);
        });
    },
    count : function(aModel, aSelector, aCallback) {
        aModel.count(aSelector, function(err, count) {

            var ret;
            if (err) ret = errorCallback(err);
            else {
                ret = {
                    status: 200,
                    state: STATE.SUCCESS,
                    data: count + ''
                };
            }

            aCallback(ret);
        });
    },
    update : function(aModel, aSelector, aUpdate, aOptions, aCallback) {
        aModel.update(aSelector, aUpdate, aOptions, function(err) {

            var ret;
            if (err) ret = errorHandler(err);
            else {
                ret = {
                    status : 204,
                    state : STATE.SUCCESS
                };
            }

            aCallback(ret);
        });
    },
    findOneAndUpdate : function(aModel, aSelector, aUpdate, aOptions, aCallback) {
        aModel.findOneAndUpdate(aSelector, aUpdate, aOptions, function(err, data) {

            var ret = null;
            if (err) ret = errorHandler(err);
            else if ((!Array.isArray(data) && data) || (Array.isArray(data) && data.length > 0)){
                ret = {
                    status: 200,
                    state: STATE.SUCCESS,
                    data: data
                };
            }
            else {
                ret = {
                    status: 404,
                    state: STATE.FAIL
                };
            }

            aCallback(ret);
        });
    },
    findOneAndRemove : function(aModel, aSelector, aOptions, aCallback) {
        aModel.findOneAndRemove(aSelector, aOptions, function(err, data){

            var ret;
            if (err) ret = errorHandler(err);
            else if ((!Array.isArray(data) && data) || (Array.isArray(data) && data.length > 0)) {
                ret = {
                    status: 200,
                    state: STATE.SUCCESS,
                    data: data
                };
            }
            else {
                ret = {
                    status: 404,
                    state: STATE.FAIL
                };
            }

            aCallback(ret);
        });
    }
};

module.exports.errorHandler = errorHandler;
module.exports.STATE = STATE;
module.exports.helper = crudHelper;
module.exports.connect = function() {
    return function(req, res, next) {
        req.crud = crudHelper;
        req.crudState = STATE;
        next();
    };
};
