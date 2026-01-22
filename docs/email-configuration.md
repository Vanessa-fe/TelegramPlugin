# Configuration Email avec Brevo

Ce guide explique comment configurer Brevo pour l'envoi d'emails transactionnels et comment authentifier votre domaine avec SPF, DKIM et DMARC.

## 1. Créer un compte Brevo

1. Inscrivez-vous sur [brevo.com](https://www.brevo.com)
2. Le plan gratuit inclut 300 emails/jour

## 2. Obtenir votre clé API

1. Connectez-vous à votre compte Brevo
2. Allez dans **SMTP & API** > **API Keys**
3. Cliquez sur **Generate a new API Key**
4. Copiez la clé (format: `xkeysib-xxxxx...`)

## 3. Configurer les variables d'environnement

```env
BREVO_API_KEY=xkeysib-votre-cle-api
BREVO_FROM_EMAIL=noreply@votredomaine.com
BREVO_FROM_NAME=Votre Nom d'Application
```

## 4. Authentification du domaine (SPF/DKIM/DMARC)

L'authentification DNS est **essentielle** pour éviter que vos emails arrivent en spam.

### 4.1 Configurer le domaine dans Brevo

1. Allez dans **Senders & Domains** > **Domains**
2. Cliquez sur **Add a domain**
3. Entrez votre domaine (ex: `votredomaine.com`)
4. Brevo vous fournira les enregistrements DNS à ajouter

### 4.2 SPF (Sender Policy Framework)

SPF indique quels serveurs sont autorisés à envoyer des emails pour votre domaine.

**Enregistrement DNS à ajouter (type TXT) :**

```
Nom: @
Type: TXT
Valeur: v=spf1 include:spf.brevo.com ~all
```

Si vous avez déjà un enregistrement SPF, ajoutez `include:spf.brevo.com` avant `~all` :

```
v=spf1 include:_spf.google.com include:spf.brevo.com ~all
```

### 4.3 DKIM (DomainKeys Identified Mail)

DKIM ajoute une signature cryptographique à vos emails.

Brevo vous fournira un enregistrement DKIM unique. Généralement :

**Enregistrement DNS à ajouter (type TXT) :**

```
Nom: mail._domainkey
Type: TXT
Valeur: k=rsa; p=MIGfMA0GCSqGSIb3DQEBA... (fourni par Brevo)
```

**Important :** La valeur exacte est fournie dans votre dashboard Brevo.

### 4.4 DMARC (Domain-based Message Authentication)

DMARC indique comment traiter les emails qui échouent SPF/DKIM.

**Enregistrement DNS à ajouter (type TXT) :**

```
Nom: _dmarc
Type: TXT
Valeur: v=DMARC1; p=quarantine; rua=mailto:dmarc@votredomaine.com; pct=100
```

**Explication des paramètres :**
- `p=quarantine` : Les emails non authentifiés vont en spam (alternatives: `none`, `reject`)
- `rua=mailto:...` : Adresse pour recevoir les rapports DMARC
- `pct=100` : Appliquer la politique à 100% des emails

**Progression recommandée :**
1. Commencer avec `p=none` pour surveiller sans bloquer
2. Passer à `p=quarantine` après quelques semaines
3. Optionnel : passer à `p=reject` pour une protection maximale

### 4.5 Vérification de la configuration

1. **Dans Brevo** : Allez dans **Domains** et vérifiez que tous les statuts sont verts
2. **Outils en ligne** :
   - [MXToolbox](https://mxtoolbox.com/SuperTool.aspx) - Entrez votre domaine
   - [Mail-Tester](https://www.mail-tester.com) - Envoyez un email test
   - [DMARC Analyzer](https://www.dmarcanalyzer.com/dmarc/dmarc-record-check/)

## 5. Bonnes pratiques

### Contenu des emails
- Évitez les mots spam (GRATUIT, URGENT, etc.)
- Incluez un lien de désinscription
- Utilisez un ratio texte/images équilibré

### Réputation d'expéditeur
- Envoyez régulièrement (pas de gros pics soudains)
- Maintenez un faible taux de bounce
- Surveillez les plaintes spam

### Monitoring
- Vérifiez les statistiques dans le dashboard Brevo
- Configurez les rapports DMARC
- Réagissez rapidement aux problèmes de délivrabilité

## 6. Exemple complet d'enregistrements DNS

Pour le domaine `example.com` :

| Type | Nom | Valeur |
|------|-----|--------|
| TXT | @ | `v=spf1 include:spf.brevo.com ~all` |
| TXT | mail._domainkey | `k=rsa; p=...` (valeur Brevo) |
| TXT | _dmarc | `v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com` |

## 7. Dépannage

### Emails en spam
1. Vérifiez que SPF/DKIM/DMARC sont correctement configurés
2. Testez avec Mail-Tester pour identifier les problèmes
3. Vérifiez que votre domaine n'est pas blacklisté

### Erreurs d'envoi
1. Vérifiez que la clé API est valide
2. Vérifiez les logs dans le dashboard Brevo
3. Assurez-vous que l'adresse d'envoi est vérifiée

### Enregistrements DNS non détectés
- Les changements DNS peuvent prendre jusqu'à 48h pour se propager
- Utilisez `dig` ou `nslookup` pour vérifier la propagation :
  ```bash
  dig TXT votredomaine.com
  dig TXT mail._domainkey.votredomaine.com
  dig TXT _dmarc.votredomaine.com
  ```
