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


exports.createSauces = (req, res, next) => {
    const SaucesObject = JSON.parse(req.body.sauce);
    delete SaucesObject._id;
    delete SaucesObject._userId;
    const sauces = new Sauces({
        ...SaucesObject,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    });
  
    sauces.save()
    .then(() => { res.status(201).json({message: 'Sauce enregistrée !'})})
    .catch(error => { res.status(400).json( { error })})
 };

 exports.modifySauce = (req, res, next) => {
    Sauces.findOne({ _id: req.params.id })
      .then((sauce) => {
        /**Si userId n'est pas le créateur de la sauce
         * et qu'il modifie l'image
         */
        if (sauce.userId != req.auth.userId && req.file) {
          const filename = req.file.filename;
          fs.unlink(`images/${filename}`, (error) => {
            if (error) throw error;
          })
          return res.status(403).json({ error: 'Error' });
          /**Si userId n'est pas le créateur de la sauce
         * et qu'il modifie que le texte
         */
        } else if (sauce.userId != req.auth.userId) {
          return res.status(403).json({ error: 'Error' });
        } else {
          /**Si userId est le créateur de la sauce
         * et qu'il modifie l'image
         */
          if (req.file) {
            const sauceObject = req.file ? {
              ...JSON.parse(req.body.sauce),
              imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
            } : { ...req.body };
            delete sauceObject._userId;
            const filenames = sauce.imageUrl.split('/images/')[1];
            fs.unlink(`images/${filenames}`, () => {
              Sauces.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
                .then(() => res.status(200).json({ message: 'Sauce modifiée avec succès !' }))
                .catch(error => res.status(401).json({ error }));
            })
            /**Si userId est le créateur de la sauce
         * et qu'il modifie que le texte
         */
          } else {
            const sauceObject = req.file ? {
              ...JSON.parse(req.body.sauce),
              imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
            } : { ...req.body };
            delete sauceObject._userId;
            Sauces.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
              .then(() => res.status(200).json({ message: 'Sauce modifiée avec succès !' }))
              .catch(error => res.status(401).json({ error }));
          }
        }
      })
      .catch((error) => {
        res.status(400).json({ error });
      });
  };
  
 /* exports.modifySauce = (req, res, next) => {
    let saucesObject = req.file ? {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body };
  console.log(req.body)
    delete saucesObject._userId;
    Sauces.findOne({_id: req.params.id})
        .then((sauces) => {
            if (sauces.userId != req.auth.userId) {
                res.status(401).json({ message : 'Not authorized'});
            } else {
                const filename = sauces.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`);
                Sauces.updateOne({ _id: req.params.id}, { ...saucesObject, _id: req.params.id})
                .then(() => res.status(200).json({message : 'Sauce modifiée!'}))
                .catch(error => res.status(401).json({ error }));
            }
        })
        .catch((error) => {
            res.status(400).json({ error });
        });
 }; 
*/
 exports.deleteSauces = (req, res, next) => {
    Sauces.findOne({ _id: req.params.id})
        .then(sauces => {
            if (sauces.userId != req.auth.userId) {
                res.status(401).json({message: 'Not authorized'});
            } else {
                const filename = sauces.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
                    Sauces.deleteOne({_id: req.params.id})
                        .then(() => { res.status(200).json({message: 'Sauce supprimée !'})})
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
                } else if (sauces.usersDisliked.includes(req.body.userId)) {
                    Sauces.updateOne({ _id: req.params.id }, { $pull: { usersDisliked: req.body.userId }, $inc: { dislikes: -1 } })
                            .then(() => { res.status(200).json({ message: 'Dislike supprimé !' }) })
                            .catch(error => res.status(400).json({ error }));
                }
            }
        })
        .catch(error => res.status(400).json({ error }));   
};