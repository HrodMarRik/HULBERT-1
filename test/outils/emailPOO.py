import imaplib
import smtplib
from email.message import EmailMessage
from email.parser import BytesParser

class MailBox:
    def __init__(self, email, password):
        self.email = email
        self.password = password
        self.Firstmail = None
        self.dossier = "INBOX"
        self.nb = 50
        self.conn = None

        self.serveur = {
            "smtp": {
                "gmail": "smtp.gmail.com",
                "outlook": "smtp.office365.com",
            },
            "imap": {
                "gmail": "imap.gmail.com",
                "outlook": "outlook.office365.com",
            },
        }

        self.endmail = None
        if self.email.endswith("gmail.com"):
            self.endmail = "gmail"
        elif self.email.endswith("outlook.com"):
            self.endmail = "outlook"

        self.connection()

    def connection(self):
        if self.endmail and self.endmail in self.serveur["imap"]:
            try:
                self.conn = imaplib.IMAP4_SSL(self.serveur["imap"][self.endmail])
                self.conn.login(self.email, self.password)
            except Exception as e:
                print(f"Error connecting to the server: {e}")
                self.conn = None

    def changeFolder(self, folder):
        if folder in self.listFolders():
            self.dossier = folder
            print('folder changed')
        else:
            print(folder, "pas dans : ", self.listFolders)

    def listFolders(self):
        if not self.conn:
            raise ConnectionError("Not connected to the server.")
        status, folders = self.conn.list()
        if status != "OK":
            raise ValueError("Unable to list folders.")
        return [folder.decode().split('"')[-2] for folder in folders]

    def readMails(self):
        if not self.conn:
            raise ConnectionError("Not connected to the server.")
        status, _ = self.conn.select(self.dossier)
        if status != "OK":
            available_folders = self.listFolders()
            raise ValueError(f"Unable to select folder: {self.dossier}. Available folders: {available_folders}")

        status, data = self.conn.search(None, "ALL")
        if status != "OK":
            raise ValueError("Unable to search for emails.")

        mail_ids = data[0].split()[-self.nb:]
        emails = []
        for mail_id in mail_ids:
            status, msg_data = self.conn.fetch(mail_id, "(RFC822)")
            if status != "OK":
                raise ValueError(f"Unable to fetch email with ID: {mail_id}")
            for response_part in msg_data:
                if isinstance(response_part, tuple):
                    parser = BytesParser()
                    msg = parser.parsebytes(response_part[1])
                    email_info = {
                        "ID": mail_id.decode("utf-8"),
                        "From": msg.get("From"),
                        "Subject": msg.get("Subject")
                    }
                    emails.append(email_info)
        return emails

    def readMail(self, mail_id):
        mail = {}
        if not self.conn:
            raise ConnectionError("Not connected to the server.")
        status, _ = self.conn.select(self.dossier)
        if status != "OK":
            raise ValueError(f"Unable to select folder: {self.dossier}")

        status, msg_data = self.conn.fetch(mail_id, "(RFC822)")
        if status != "OK":
            raise ValueError(f"Unable to fetch email with ID: {mail_id}")

        for response_part in msg_data:
            if isinstance(response_part, tuple):
                parser = BytesParser()
                msg = parser.parsebytes(response_part[1])
                mail = {
                    "ID": mail_id,
                    "From": msg.get("From"),
                    "Subject": msg.get("Subject"),
                    "Content-Type": msg.get("Content-Type"),
                    "Body": {}  # Ajouter un champ pour stocker les corps des emails
                }
                if msg.is_multipart():
                    for part in msg.walk():
                        content_type = part.get_content_type()
                        if content_type == "text/plain":
                            mail["Body"]["text/plain"] = part.get_payload(decode=True).decode(part.get_content_charset())
                        elif content_type == "text/html":
                            mail["Body"]["text/html"] = part.get_payload(decode=True).decode(part.get_content_charset())
                else:
                    # Email non multipart
                    mail["Body"]["text/plain"] = msg.get_payload(decode=True).decode(msg.get_content_charset())
                
                return mail

class Email:
    def __init__(self, ID, From, To=None):
        self.ID = ID
        self.From = From
        self.To = To
        self.Subject = None

    def CREATE(self, smtp_server, email, password):
        msg = EmailMessage()
        msg["From"] = self.From
        msg["To"] = self.To
        msg["Subject"] = self.Subject
        with smtplib.SMTP_SSL(smtp_server, 465) as server:
            server.login(email, password)
            server.send_message(msg)

    def READ(self, mailbox, mail_id):
        return mailbox.readMail(mail_id)

    def UPDATE(self):
        pass

    def DELETE(self, mailbox, mail_id):
        if not mailbox.conn:
            raise ConnectionError("Not connected to the server.")
        status, _ = mailbox.conn.select(mailbox.dossier)
        if status != "OK":
            raise ValueError(f"Unable to select folder: {mailbox.dossier}")

        mailbox.conn.store(mail_id, "+FLAGS", "\\Deleted")
        mailbox.conn.expunge()

    def send(self):
        pass

if __name__ == '__main__':
    boite = MailBox("somosminal@gmail.com", "itwlwwgcgcdzqryv")
    try:
        print(boite.readMail("1"))
    except ConnectionError as e:
        print(f"Connection error: {e}")
    except ValueError as e:
        print(f"Value error: {e}")

