function async(iterations, func, callback) {
    var index = 0;
    var done = false;
    var loop = {
        next: window.requestAnimationFrame.bind(null, function() {
            if (done) {
                return;
            }

            if (index < iterations) {
                index++;
                func(loop);

            } else {
                done = true;
                callback();
            }
        }),

        iteration: function() {
            return index - 1;
        },

        break: function() {
            done = true;
            callback();
        }
    };

    loop.next();
    return loop;
};