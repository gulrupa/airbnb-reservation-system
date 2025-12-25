import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Imap from 'imap';
import { simpleParser, ParsedMail } from 'mailparser';

export interface EmailMessage {
  uid: number;
  subject: string;
  from: string;
  date: Date;
  body: string;
  html?: string;
}

@Injectable()
export class EmailFetchService {
  private readonly logger = new Logger(EmailFetchService.name);

  constructor(private readonly configService: ConfigService) {}

  async fetchEmailsFromAirbnb(): Promise<EmailMessage[]> {
    const imapConfig = {
      user: this.configService.get<string>('EMAIL_USER'),
      password: this.configService.get<string>('EMAIL_PASSWORD'),
      host: this.configService.get<string>('EMAIL_HOST', 'imap.gmail.com'),
      port: this.configService.get<number>('EMAIL_PORT', 993),
      tls: this.configService.get<boolean>('EMAIL_TLS', true),
      tlsOptions: { rejectUnauthorized: false },
    };

    if (!imapConfig.user || !imapConfig.password) {
      this.logger.error(
        'Configuration email manquante: EMAIL_USER et EMAIL_PASSWORD sont requis',
      );
      throw new Error('Configuration email manquante');
    }

    return new Promise((resolve, reject) => {
      const imap = new Imap(imapConfig);
      const emails: EmailMessage[] = [];

      imap.once('ready', () => {
        this.logger.log('Connexion IMAP établie');
        imap.openBox('INBOX', false, (err, box) => {
          if (err) {
            this.logger.error(`Erreur lors de l'ouverture de la boîte: ${err.message}`);
            imap.end();
            return reject(err);
          }

          // Rechercher les emails non lus (plus efficace que 'ALL')
          // On filtrera ensuite pour ne garder que ceux contenant '@airbnb.com' dans le corps du mail
          // (car les emails sont transférés depuis segu.vincent@gmail.com)
          // Note: Pour récupérer tous les emails, utiliser ['ALL'] à la place
          imap.search(['UNSEEN'], (err, results) => {
            if (err) {
              this.logger.error(`Erreur lors de la recherche: ${err.message}`);
              imap.end();
              return reject(err);
            }

            if (!results || results.length === 0) {
              this.logger.log('Aucun email trouvé');
              imap.end();
              return resolve([]);
            }

            this.logger.log(`${results.length} email(s) à vérifier`);

            const fetch = imap.fetch(results, {
              bodies: '',
              struct: true,
            });

            let processedCount = 0;
            let pendingParsings = 0;
            let fetchEnded = false;
            const processedUids: number[] = []; // UIDs des emails traités avec succès (ajoutés ou ignorés)

            const checkComplete = () => {
              if (fetchEnded && pendingParsings === 0) {
                this.logger.log(`${emails.length} email(s) Airbnb récupéré(s) sur ${processedCount} vérifié(s)`);
                
                // Marquer comme lus uniquement les emails correctement traités ou ignorés
                // (pas ceux qui ont eu une erreur de parsing)
                if (processedUids.length > 0) {
                  imap.addFlags(processedUids, '\\Seen', (err) => {
                    if (err) {
                      this.logger.warn(`Erreur lors du marquage des emails comme lus: ${err.message}`);
                    } else {
                      this.logger.log(`${processedUids.length} email(s) marqué(s) comme lu(s) (traités avec succès)`);
                    }
                    imap.end();
                    resolve(emails);
                  });
                } else {
                  imap.end();
                  resolve(emails);
                }
              }
            };

            fetch.on('message', (msg, seqno) => {
              let emailUid: number | undefined;
              let emailBuffer = Buffer.alloc(0);

              msg.on('body', (stream, info) => {
                stream.on('data', (chunk) => {
                  emailBuffer = Buffer.concat([emailBuffer, chunk]);
                });

                stream.once('end', () => {
                  pendingParsings++;
                  
                  // Parser l'email une fois que toutes les données sont reçues
                  simpleParser(emailBuffer)
                    .then((parsed: ParsedMail) => {
                      const fromText = parsed.from?.text || parsed.from?.value?.[0]?.address || '';
                      const bodyText = parsed.text || '';
                      const htmlText = parsed.html || '';
                      
                      this.logger.debug(
                        `Parsing email UID ${emailUid}: sujet="${parsed.subject}", body length=${bodyText.length}, html length=${htmlText.length}`,
                      );
                      
                      // Filtrer les emails contenant '@airbnb.com' dans le corps du mail
                      // (car les emails sont transférés depuis segu.vincent@gmail.com)
                      const containsAirbnb = bodyText.includes('@airbnb.com') || htmlText.includes('@airbnb.com') || fromText.includes('@airbnb.com');
                      
                      this.logger.debug(
                        `Email UID ${emailUid}: containsAirbnb=${containsAirbnb}, emailUid=${emailUid !== undefined}`,
                      );
                      
                      // Le parsing s'est bien passé, on peut marquer cet email comme traité
                      if (emailUid !== undefined) {
                        processedUids.push(emailUid); // Marquer comme lu (traités avec succès ou ignorés)
                      }
                      
                      if (containsAirbnb && emailUid !== undefined) {
                        const emailData: EmailMessage = {
                          uid: emailUid,
                          subject: parsed.subject || '',
                          from: fromText,
                          date: parsed.date || new Date(),
                          body: bodyText,
                          html: htmlText,
                        };
                        
                        emails.push(emailData);
                        this.logger.log(`Email Airbnb ajouté: ${emailData.subject} (UID: ${emailUid})`);
                      } else {
                        this.logger.debug(
                          `Email UID ${emailUid} ignoré (ne contient pas @airbnb.com): containsAirbnb=${containsAirbnb}, emailUid=${emailUid !== undefined}`,
                        );
                      }
                      
                      pendingParsings--;
                      checkComplete();
                    })
                    .catch((parseErr) => {
                      this.logger.warn(
                        `Erreur lors du parsing de l'email UID ${emailUid}: ${parseErr.message}. L'email ne sera PAS marqué comme lu.`,
                      );
                      // Ne pas ajouter à processedUids car le traitement a échoué
                      // L'email restera non lu pour être retraité plus tard
                      pendingParsings--;
                      checkComplete();
                    });
                });
              });

              msg.once('attributes', (attrs) => {
                emailUid = attrs.uid;
              });

              msg.once('end', () => {
                processedCount++;
                this.logger.debug(`Message UID ${emailUid} terminé, processedCount=${processedCount}`);
              });
            });

            fetch.once('error', (err) => {
              this.logger.error(`Erreur lors de la récupération: ${err.message}`);
              imap.end();
              reject(err);
            });

            fetch.once('end', () => {
              this.logger.debug(`Fetch terminé, pendingParsings=${pendingParsings}`);
              fetchEnded = true;
              checkComplete();
            });
          });
        });
      });

      imap.once('error', (err) => {
        this.logger.error(`Erreur IMAP: ${err.message}`);
        reject(err);
      });

      imap.connect();
    });
  }
}

