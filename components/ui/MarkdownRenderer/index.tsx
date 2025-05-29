import Markdown, { MarkdownProps } from "react-native-markdown-display";
import {
  H4,
  H5,
  H6,
  TypographyBodyL,
  TypographyBodySBold,
} from "../Typography";

interface MarkdownRendererProps {
  text: string;
}

const rules = {
  paragraph: (node, children, parent, styles) => (
    <TypographyBodyL key={node.key}>{children}</TypographyBodyL>
  ),
  span: (node, children, parent, styles) => (
    <TypographyBodyL key={node.key}>{children}</TypographyBodyL>
  ),
  heading1: (node, children, parent, styles) => (
    <H4 key={node.key}>{children}</H4>
  ),
  heading2: (node, children, parent, styles) => (
    <H5 key={node.key}>{children}</H5>
  ),
  heading3: (node, children, parent, styles) => (
    <H6 key={node.key}>{children}</H6>
  ),
  heading4: (node, children, parent, styles) => (
    <H6 key={node.key}>{children}</H6>
  ),
  heading5: (node, children, parent, styles) => (
    <H6 key={node.key}>{children}</H6>
  ),
  heading6: (node, children, parent, styles) => (
    <H6 key={node.key}>{children}</H6>
  ),
  strong: (node, children, parent, styles) => (
    <TypographyBodySBold key={node.key}>bold? {children}</TypographyBodySBold>
  ),
} as MarkdownProps["rules"];

export function MarkdownRenderer({ text }: MarkdownRendererProps) {
  return <Markdown rules={rules}>{text}</Markdown>;
}
