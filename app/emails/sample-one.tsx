import { Body, Heading, Html, Tailwind } from "@react-email/components";
import emailTailwindConfig from "./email-tailwind.config";

type Props = {
  name: string;
};

export default function SampleEmail({ name }: Props) {
  return (
    <Html>
      <Tailwind config={emailTailwindConfig}>
        <Body>
          <Heading>Hello {name}</Heading>
        </Body>
      </Tailwind>
    </Html>
  );
}
