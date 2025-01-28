import { Body, Heading, Html, Tailwind } from "@react-email/components";
import emailTailwindConfig from "./email-tailwind.config";

type Props = {
  widgetId: string;
};

export default function SampleEmail({ widgetId }: Props) {
  return (
    <Html>
      <Tailwind config={emailTailwindConfig}>
        <Body>
          <Heading>Hello {widgetId}</Heading>
        </Body>
      </Tailwind>
    </Html>
  );
}
