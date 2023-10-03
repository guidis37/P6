const Sauces = require('../models/sauces');
const fs = require('fs');

exports.getAllSauces = (req, res) => {
    Sauces.find()
        .then(response => res.status(200).json(response))
        .catch(error => res.status(404).json({error}))
};

exports.getOneSauce = (req, res) => {
    Sauces.findOne({_id: req.params.id})
        .then(sauce => res.status(200).json(sauce))
        .catch(error => res.status(404).json({error}))
};
// bonjour

exports.createSauces = (req, res, next) => {
    const SaucesObject = JSON.parse(req.body.sauce);
    delete SaucesObject._id;
    delete SaucesObject._userId;
    const sauces = new Sauces({
        ...SaucesObject,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    });
  
    sauces.save()
    .then(() => { res.status(201).json({message: 'Objet enregistré !'})})
    .catch(error => { res.status(400).json( { error })})
 };

 exports.updateSauces = (req, res, next) => {
    const SaucesObject = req.file ? {
        ...JSON.parse(req.body.Sauces),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body };
  
    delete SaucesObject._userId;
    Sauces.findOne({_id: req.params.id})
        .then((sauces) => {
            if (sauces.userId != req.auth.userId) {
                res.status(401).json({ message : 'Not authorized'});
            } else {
                sauces.updateOne({ _id: req.params.id}, { ...SaucesObject, _id: req.params.id})
                .then(() => res.status(200).json({message : 'Objet modifié!'}))
                .catch(error => res.status(401).json({ error }));
            }
        })
        .catch((error) => {
            res.status(400).json({ error });
        });
 };

 exports.deleteSauces = (req, res, next) => {
    Sauces.findOne({ _id: req.params.id})
        .then(Sauces => {
            if (Sauces.userId != req.auth.userId) {
                res.status(401).json({message: 'Not authorized'});
            } else {
                const filename = Sauces.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
                    Sauces.deleteOne({_id: req.params.id})
                        .then(() => { res.status(200).json({message: 'Objet supprimé !'})})
                        .catch(error => res.status(401).json({ error }));
                });
            }
        })
        .catch( error => {
            res.status(500).json({ error });
        });
 };



exports.likeSauce = (req, res) => {
    Sauces.findOne({ _id: req.params.id })
        .then(sauces => {
            if (req.body.like === 1) {
                if (sauces.usersLiked.includes(req.body.userId)) {
                    res.status(401).json({error: 'Sauce déja liké'});
                } else {
                    Sauces.updateOne({ _id: req.params.id }, { $inc: { likes: req.body.like++ }, $push: { usersLiked: req.body.userId } })
                        .then(() => res.status(200).json({ message: 'Like ajouté !' }))
                        .catch(error => res.status(400).json({ error }))
                }
            } 
            else if (req.body.like === -1) {
                if (sauces.usersDisliked.includes(req.body.userId)) {
                    res.status(401).json({error: 'Sauce déja disliké'});
                } else {
                    Sauces.updateOne({ _id: req.params.id }, { $inc: { dislikes: (req.body.like++) * -1 }, $push: { usersDisliked: req.body.userId } })
                        .then(() => res.status(200).json({ message: 'Dislike ajouté !' }))
                        .catch(error => res.status(400).json({ error }));
                }
            } else {
                if (sauces.usersLiked.includes(req.body.userId)) {
                    Sauces.updateOne({ _id: req.params.id }, { $pull: { usersLiked: req.body.userId }, $inc: { likes: -1 } })
                        .then(() => { res.status(200).json({ message: 'Like supprimé !' }) })
                        .catch(error => res.status(400).json({ error }));
                } else if (sauce.usersDisliked.includes(req.body.userId)) {
                    Sauces.updateOne({ _id: req.params.id }, { $pull: { usersDisliked: req.body.userId }, $inc: { dislikes: -1 } })
                            .then(() => { res.status(200).json({ message: 'Dislike supprimé !' }) })
                            .catch(error => res.status(400).json({ error }));
                }
            }
        })
        .catch(error => res.status(400).json({ error }));   
};