package main

import (
	"bytes"
	"fmt"
	"io"
	"os"
	"path"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/open-component-model/ocm/pkg/cobrautils"
	"github.com/spf13/cobra"
)

const fmTmpl = `---
title: %s
name: %s
url: %s
date: %s
draft: false
images: []
menu:
  docs:
    parent: %s
toc: true
isCommand: %v
---
`

func genMarkdownTreeCustom(cmd *cobra.Command, dir, urlPrefix, parentCmd string) error {
	for _, c := range cmd.Commands() {
		if c.Name() == "configfile" {
			strings.TrimSpace(c.Name())
		}
		if !c.IsAvailableCommand() && !c.IsAdditionalHelpTopicCommand() {
			continue
		}
		parent := commandToID(c.Parent().CommandPath())
		if err := genMarkdownTreeCustom(c, dir, urlPrefix, parent); err != nil {
			return err
		}
	}

	var basename string
	if cmd.HasAvailableSubCommands() && !cmd.HasParent() {
		basename = "_index.md"
	} else if cmd.HasAvailableSubCommands() && cmd.HasParent() {
		basename = "_index.md"
		dir = path.Join(dir, commandToDir(cmd.CommandPath()))
	} else if cmd.HasParent() {
		dir = path.Join(dir, commandToDir(cmd.Parent().CommandPath()))
		basename = commandToID(cmd.CommandPath()) + ".md"
	} else {
		basename = commandToID(cmd.CommandPath()) + ".md"
	}

	if err := os.MkdirAll(dir, os.ModePerm); err != nil {
		return fmt.Errorf("error creating command sub-directory: %w", err)
	}

	filename := filepath.Join(dir, basename)

	f, err := os.Create(filename)
	if err != nil {
		return err
	}
	defer f.Close()

	linkHandler := func(path string) string {
		link := strings.Replace(path, " ", "/", -1)
		link = strings.Replace(link, "ocm", "cli", -1)
		return "/docs/" + link
	}

	frontmatter := func(filename string) string {
		now := time.Now().Format(time.RFC3339)
		cmdName := commandToID(cmd.Name())
		title := strings.TrimSuffix(cmdName, path.Ext(cmdName))
		var url, name string
		isCmd := true
		if cmdName == "cli-reference" {
			url = urlPrefix
			name = title
			isCmd = false
		} else if parentCmd == "cli-reference" {
			url = urlPrefix + strings.ToLower(title) + "/"
			name = title
		} else {
			url = urlPrefix + parentCmd + "/" + strings.ToLower(title) + "/"
			name = fmt.Sprintf("%s %s", parentCmd, title)
		}
		return fmt.Sprintf(fmTmpl, title, name, url, now, parentCmd, isCmd)
	}

	if _, err := io.WriteString(f, frontmatter(filename)); err != nil {
		return err
	}

	if err := genMarkdownCustom(cmd, f, linkHandler); err != nil {
		return err
	}

	return nil
}

func genMarkdown(cmd *cobra.Command, w io.Writer) error {
	return genMarkdownCustom(cmd, w, cobrautils.LinkForPath)
}

func genMarkdownCustom(cmd *cobra.Command, w io.Writer, linkHandler func(string) string) error {
	cmd.InitDefaultHelpCmd()
	cmd.InitDefaultHelpFlag()

	buf := new(bytes.Buffer)
	name := cmd.CommandPath()

	if cmd.Runnable() || cmd.HasAvailableSubCommands() && name != "ocm" {
		buf.WriteString("### Usage\n\n")
		buf.WriteString(fmt.Sprintf("```\n%s\n```\n\n", useLine(cmd)))
	}

	if cmd.IsAvailableCommand() {
		if err := printOptions(buf, cmd, name); err != nil {
			return err
		}
	}

	if len(cmd.Long) > 0 {
		if name == "ocm" {
			buf.WriteString("### Introduction\n\n")
		} else {
			buf.WriteString("### Description\n\n")
		}
		_, desc := cobrautils.SubstituteCommandLinks(cmd.Long, cobrautils.FormatLinkWithHandler(linkHandler))
		buf.WriteString(desc + "\n\n")
	}

	if len(cmd.Example) > 0 {
		buf.WriteString("### Examples\n\n")
		buf.WriteString(fmt.Sprintf("```\n%s\n```\n\n", cmd.Example))
	}

	if hasSeeAlso(cmd) {
		header := cmd.HasHelpSubCommands() && cmd.HasAvailableSubCommands()
		buf.WriteString("### See Also\n\n")
		if cmd.HasParent() {
			header = true
			parent := cmd
			for parent.HasParent() {
				parent = parent.Parent()
				pname := parent.CommandPath()
				if parent.HasParent() {
					buf.WriteString(fmt.Sprintf("* [%s](%s)\t &mdash; %s\n", pname, linkHandler(parent.CommandPath()), parent.Short))
				}
			}
			cmd.VisitParents(func(c *cobra.Command) {
				if c.DisableAutoGenTag {
					cmd.DisableAutoGenTag = c.DisableAutoGenTag
				}
			})
		}

		children := cmd.Commands()
		sort.Sort(byName(children))

		subheader := false
		for _, child := range children {
			if !child.IsAvailableCommand() || child.IsAdditionalHelpTopicCommand() {
				continue
			}
			if header && !subheader {
				buf.WriteString("\n\n##### Sub Commands\n\n")
				subheader = true
			}
			cname := name + " " + "<b>" + child.Name() + "</b>"
			buf.WriteString(fmt.Sprintf("* [%s](%s)\t &mdash; %s\n", cname, linkHandler(child.CommandPath()), child.Short))
		}
		buf.WriteString("\n")

		subheader = false
		for _, child := range children {
			if !child.IsAdditionalHelpTopicCommand() {
				continue
			}
			if header && !subheader {
				buf.WriteString("\n\n##### Additional Help Topics\n\n")
				subheader = true
			}
			cname := name + " " + "<b>" + child.Name() + "</b>"
			buf.WriteString(fmt.Sprintf("* [%s](%s)\t &mdash; %s\n", cname, linkHandler(child.CommandPath()), child.Short))
		}
		if subheader {
			buf.WriteString("\n")
		}

	}
	if !cmd.DisableAutoGenTag {
		buf.WriteString("###### Auto generated by spf13/cobra on " + time.Now().Format("2-Jan-2006") + "\n")
	}

	_, err := buf.WriteTo(w)

	return err
}

func printOptions(buf *bytes.Buffer, cmd *cobra.Command, name string) error {
	flags := cmd.NonInheritedFlags()

	flags.SetOutput(buf)

	if flags.HasAvailableFlags() {
		buf.WriteString("### Options\n\n```\n")
		flags.PrintDefaults()
		buf.WriteString("```\n\n")
	}

	parentFlags := cmd.InheritedFlags()

	parentFlags.SetOutput(buf)

	if parentFlags.HasAvailableFlags() {
		buf.WriteString("### Options inherited from parent commands\n\n```\n")
		parentFlags.PrintDefaults()
		buf.WriteString("```\n\n")
	}

	return nil
}

func useLine(c *cobra.Command) string {
	useline := c.Use
	if strings.Index(useline, " ") < 0 {
		if c.HasAvailableLocalFlags() {
			useline += " [<options>]"
		}
		if c.HasAvailableSubCommands() {
			if c.Runnable() {
				useline += " [<sub command> ...]"
			} else {
				useline += " <sub command> ..."
			}
		}
	}

	if c.HasParent() {
		useline = c.Parent().CommandPath() + " " + useline
	}

	if c.DisableFlagsInUseLine {
		return useline
	}

	if c.HasAvailableFlags() && !strings.Contains(useline, "[<options>]") {
		useline += " [<options>]"
	}

	return useline
}

func commandToID(command string) string {
	if command == "ocm" {
		return "cli-reference"
	}
	return strings.TrimPrefix(strings.Replace(command, " ", "_", -1), "ocm_")
}

func commandToDir(command string) string {
	return strings.TrimPrefix(strings.Replace(command, " ", "-", -1), "ocm-")
}
