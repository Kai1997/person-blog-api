const mongoose = require('mongoose'),
    passwordHelper = require('../helpers/password.helper'),
    User = mongoose.model('User'),
    constants = require('../common/constants'),
    MessageConstants = constants.MessageConstants,
    Joi = require('joi');

class UserService {
    register(host, p) {
        return new Promise((resolve, reject) => {
            var username = p.username.toLowerCase();
            const validate = Joi.validate(p, {
                username: Joi.string().required().min(6),
                password: Joi.string().required().min(6),
                email: Joi.string().email({ minDomainAtoms: 2 }),
                address: Joi.string(),
                tel: Joi.string(),
                background: Joi.string(),
                isActive: Joi.boolean()
            });
            if (validate.error) {
                return resolve({
                    status: false,
                    message: validate.error.details[0].message
                });
            }
            User.findOne({
                email: p.email
            })
                .then(user => {
                    if (user != null) {
                        return resolve({
                            result: false,
                            message: MessageConstants.EmailExistingError
                        })
                    } else {
                        let user = new User({
                            username: username,
                            password: passwordHelper.hash(p.email, p.password),
                            email: p.email,
                            tel: p.tel,
                            address: p.address,
                            coin: 0,
                            background: '',
                            isActive: false,
                            lang: p.lang,
                            createdAt: new Date()
                        });

                        user.save().then(() => {
                            // informm to sp
                            resolve({
                                result: true,
                                message: MessageConstants.RegisterSuccessfully
                            });
                        }).catch(err => reject(err));
                    }
                })
                .catch(err => reject(err));
            // });
        });
    }

    checkUsername(username) {
        return new Promise((resolve, reject) => {
            User.findOne({
                username: username
            })
                .then(user => {
                    if (user) {
                        resolve({ success: false, message: MessageConstants.UsernameExistingError })
                    } else {
                        resolve({ success: true })
                    }
                })
                .catch(err => reject(err));
        });
    }

    verify(email, code) {
        return new Promise((resolve, reject) => {
            User.findOne({
                email: email,
            })
                .then(user => {
                    if (user == null) {
                        resolve({
                            status: false,
                            message: MessageConstants.LinkNotExistingError
                        })
                    } else {
                        if (!user.isActive) {
                            user.isActive = true;
                            user.save().then(() => {
                                resolve({
                                    status: true,
                                    message: MessageConstants.VerifyEmailSuccessfully
                                });
                            }).catch(err => reject(err));
                        } else {
                            resolve({
                                status: false,
                                message: MessageConstants.EmailVerified
                            });
                        }


                    }
                })
                .catch(err => reject(err));
        });
    }

    getAll(limit, pageCur, type) {
        let option = {
            isActive: true
        }
        if (parseInt(type) == 1) { //admin
            option = {}
        }
        let perPage = parseInt(limit || 1);
        let page = parseInt(pageCur || 1);
        return new Promise((resolve, reject) => {

            User.find(option, { username: 1, email: 1, tel: 1, address: 1, background: 1, isActive: 1, coin: 1, role: 1 }).skip((perPage * page) - perPage)
                .limit(perPage)
                .populate("categoryId")
                .exec(function (err, user) {
                    User.count(option).exec(function (err, count) {
                        if (err) return reject(err);
                        return resolve({
                            data: user,
                            current: page,
                            pages: Math.ceil(count / perPage),
                            number: count
                        })

                    })
                })
        });
    }
    countUser() {
        return new Promise((resolve, reject) => User.count({ })
            .then(count => resolve(count))
            .catch(err => reject(err)));
    }
    getByUsername(username) {
        return new Promise((resolve, reject) => {
            User.findOne({
                username: username
            })
                .then(user => {
                    resolve(user)
                })
                .catch(err => reject(err));
        });
    }



    getUserById(id) {
        console.log(id)
        return new Promise((resolve, reject) => {
            User.findOne({
                _id: id,
                // isActive: true,
                // isDeleted: false
            })
                .then(user => resolve(user))
                .catch(err => reject(err));
        });
    }
    addOrUpdate(user) {
        return new Promise((resolve, reject) => {
            let query = {
                _id: user._id
            };
            let options = {
                upsert: true
            };
            User.findOneAndUpdate(query, user, options)
                .then(cus => resolve(cus))
                .catch(err => reject(err));
        });
    }

    updateBackground(userId, bgName) {
        return new Promise((resolve, reject) => {
            let query = {
                _id: userId
            };
            let options = {
                upsert: true
            };
            User.findOneAndUpdate(query, {
                background: bgName
            }, options)
                .then(cus => resolve(cus))
                .catch(err => reject(err));
        });
    }

    getById(id) {
        return new Promise((resolve, reject) => {
            User.findById(id)
                .then(user => resolve(user))
                .catch(err => reject(err));
        });
    }
    updateActive(userId, id, isActive) {
        return new Promise((resolve, reject) => {
            User.findOne({ _id: userId })
                .then(user => {
                    if (user != null) {
                        if (user.role == 1) { //role =1 admin
                            // 0 is false, 1 is true
                            let option = {
                                isActive: true
                            }
                            if (isActive == 1) {
                                option = {
                                    isActive: false
                                }
                            }

                            User.update({
                                _id: id
                            }, option)
                                .then((post) => {
                                    resolve({
                                        success: true,
                                        messsage: MessageConstants.SavedSuccessfully
                                    })
                                })
                        } else {
                            resolve({
                                success: false,
                                messsage: MessageConstants.NotAllowChangeActive
                            })
                        }
                    }
                })
                .catch(err => reject(err));

        });
    }
    addDeviceToken(userId, data) {
        let deviceToken = data.deviceToken;
        return new Promise((resolve, reject) => {
            User.findById(userId)
                .then(user => {
                    if (user.deviceTokens) {
                        if (user.deviceTokens.indexOf(deviceToken) < 0) {
                            {
                                user.deviceTokens.push(deviceToken);
                                user.save().then(() => resolve({
                                    success: true, message: "Device token was added successfully"
                                }));
                            }
                        } else {
                            resolve({
                                success: true, message: "Device token already exists"
                            });
                        }
                    } else {
                        user.deviceTokens = [deviceToken];
                        user.save().then(() => resolve({
                            success: true, message: "Device token was added successfully"
                        }));
                    }
                })
                .catch(err => reject(err));
        });
    }

    updateUser(userId, p) {
        return new Promise((resolve, reject) => {
            User.findById(userId)
                .then(user => {
                    if (user != null) {
                        if (user.role == 1) {
                            let userp ={};
                            if (p.username) userp.username = p.username;
                            if (p.email) userp.email = p.email;
                            if (p.tel) userp.tel = p.tel;
                            if (p.address) userp.address = p.address;
                            if (p.background) userp.background = p.background;
                            // if (p.password) userp.password = passwordHelper.hash(p.email, p.password);
                            if (p.coin) userp.coin = p.coin;
                            if (p.role) userp.role = p.role;
                            if (p.isActive) userp.isActive = p.isActive;
                            userp.updatedAt = new Date();
                            const validate = Joi.validate(p, {
                                username: Joi.string().required().min(6),
                                // password: Joi.string().required().min(6),
                                email: Joi.string().email({ minDomainAtoms: 2 }),
                                address: Joi.string(),
                                tel: Joi.string(),
                                _id: Joi.string(),
                                id: Joi.string(),
                                role: Joi.string(),
                                coin: Joi.string(),
                                background: Joi.string(),
                                isActive: Joi.boolean()
                            });
                            if (validate.error) {
                                return resolve({
                                    status: false,
                                    message: validate.error.details[0].message
                                });
                            }
                            User.update({
                                _id: p._id
                            }, userp)
                                .then(() => {
                                    resolve({
                                        status: true
                                      
                                    })
                                }).catch(err => reject(err));
                        
                        }
                    }

                })
                .catch(err => reject(err));
        });
    }


    async  checkPassword(userId, password) {
        const user = await User.findById(userId).select('email password');
        const encryptPassword = passwordHelper.hash(user.email, password);
        if (encryptPassword == user.password) {
            return { success: true }
        } else {
            return { success: false }
        }
    }

    async  checkUserNameExist(usernameInput) {
        var user = await User.findOne({ username: usernameInput.toLowerCase() })
        if (user != null) {
            const randomNumber = this.randomStringNumberForResetPassword();
            user.resetPasswordCodes.push({ code: randomNumber, createdAt: new Date() })
            await user.save()
            if (user.email)
                this.sentMailResetPasswordToUser(user.email, user.name, user.username, randomNumber);
            return {
                success: true
            }
        } else {
            return { success: false }
        }
    }

    async  checkCodeResetPassword(userName, code) {
        var user = await User.findOne({ username: userName.toLowerCase() });
        if (user != null) {
            let resetPasswordCodes = user.resetPasswordCodes;
            const lastCode = resetPasswordCodes[resetPasswordCodes.length - 1];
            if (code == lastCode.code) {
                return {
                    success: true
                }
            }
        }
        return { success: false }
    }

    async updatePassword(userId, newPassword, oldPassword) {
        const check = await this.checkPassword(userId, oldPassword);
        if (check.success) {
            return new Promise((resolve, reject) => {
                User.findById(userId)
                    .then(user => {
                        const encryptPassword = passwordHelper.hash(user.email, newPassword);
                        if (encryptPassword) user.password = encryptPassword;
                        user.save().then(() => resolve({
                            success: true
                        }));
                    })
                    .catch(err => reject(err));
            });
        }
    }

    async resetPassword(email, newPassword, code) {
        const check = await this.checkCodeResetPasswordValid(email, code);
        if (check) {
            return new Promise((resolve, reject) => {
                User.findOne({ email: email})
                    .then(user => {
                        const encryptPassword = passwordHelper.hash(user.email, newPassword);
                        if (encryptPassword) user.password = encryptPassword;
                        user.save().then(() => resolve({
                            success: true
                        }));
                    })
                    .catch(err => reject(err));
            });
        }
    }

    async checkCodeResetPasswordValid(userName, code) {
        var user = await User.findOne({ email: email});
        if (user && user.resetPasswordCodes) {
            const resetPasswordCodes = user.resetPasswordCodes;
            const lastCode = resetPasswordCodes[resetPasswordCodes.length - 1];
            const offsetTime = 30 * 60 * 1000;
            const currentDate = new Date();
            const expired = currentDate.getTime() - lastCode.createdAt.getTime() < offsetTime ? true : false;
            if (resetPasswordCodes[resetPasswordCodes.length - 1].code == code && expired) return true;
        }
        return false;
    }

    randomInt(low, high) {
        return Math.floor(Math.random() * (high - low) + low)
    }

    randomStringNumberForResetPassword() {
        let numbers = new Array(5)
        for (var i = 0; i < numbers.length; i++) {
            numbers[i] = this.randomInt(1, 10)
        }
        return numbers.join('');
    }

    sentMailResetPasswordToUser(email, userName, userUsename, numberReset) {
        mailHelper.sentEmailResetPasswordToUser(email, userName, userUsename, numberReset);
    }

}
module.exports = new UserService()