import { config } from "@/config";
import log from "@/lib/log";
import { render } from "@react-email/components";
import sendgrid, { type MailDataRequired } from "@sendgrid/mail";
import invariant from "tiny-invariant";
import SampleOneEmail from "./sample-one";
import SampleTwoEmail from "./sample-two";

const emailList = {
  "sample-one": SampleOneEmail,
  "sample-two": SampleTwoEmail,
} as const;

type EmailList = typeof emailList;

if (config.SENDGRID_API_KEY) {
  sendgrid.setApiKey(config.SENDGRID_API_KEY);
}

type SendEmailProps = {
  to: MailDataRequired["to"];
  from: MailDataRequired["from"];
  replyTo: MailDataRequired["replyTo"];
  attachments?: MailDataRequired["attachments"];
};

export async function sendEmail<
  EmailTemplateName extends keyof EmailList,
  EmailTemplateProps extends Parameters<EmailList[EmailTemplateName]>[0]
>(
  email: SendEmailProps,
  subject: string,
  template: EmailTemplateName,
  templateProps: EmailTemplateProps
) {
  if (!config.SENDGRID_API_KEY) {
    // TODO - add "would have sent message"
    log.debug("No SENDGRID_API_KEY found, skipping email send");
  }

  invariant(config.EMAIL_FROM_EMAIL, "EMAIL_FROM_EMAIL is not set");
  invariant(config.EMAIL_FROM_NAME, "EMAIL_FROM_NAME is not set");

  const EmailComponent = emailList[template];

  // biome-ignore lint/suspicious/noExplicitAny: the type signature for the caller is right - that's what we care about
  const html = await render(
    <EmailComponent {...(templateProps as unknown as any)} />
  );

  await sendgrid.send({
    to: email.to,
    from: {
      email: config.EMAIL_FROM_EMAIL,
      name: config.EMAIL_FROM_NAME,
    },
    subject,
    html,
    attachments: email.attachments,
    replyTo: email.replyTo,
    trackingSettings: {
      clickTracking: {
        enable: false,
      },
      openTracking: {
        enable: false,
      },
      subscriptionTracking: {
        enable: false,
      },
    },
  });
}
