package main

import (
	"flag"
	"fmt"
	"io"
	"io/fs"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// TODO:
// only print spec
// fix links
// fix numbers?
// publish glossary separately (under docs?)
// add ci workflow
//

const fmTmpl = `---
title: %s
url: %s
date: %s
draft: false
images: []
menu:
  spec:
toc: true
---
`

func main() {
	var srcDir, outputDir, urlPrefix string

	flag.StringVar(&srcDir, "src-dir", "./ocm-spec/", "output directory for generated spec")
	flag.StringVar(&outputDir, "output-dir", "./content/en/spec/", "output directory for generated spec")
	flag.StringVar(&urlPrefix, "url-prefix", "/spec", "prefix for spec urls")

	flag.Parse()

	if outputDir == "" {
		log.Fatal("Flag -output-dir is required")
	}

	if err := run(srcDir, outputDir, urlPrefix); err != nil {
		log.Fatal(err)
	}
}

func run(src, out, urlPrefix string) error {
	specPath := filepath.Join(src, "doc")
	if err := filepath.WalkDir(specPath, func(path string, d fs.DirEntry, err error) error {
		if d.IsDir() {
			return nil
		}

		filename := strings.ReplaceAll(filepath.Base(path), "README", "_index")
		dir := strings.ReplaceAll(filepath.Dir(path), specPath, "")
		if strings.HasPrefix(dir, "/proposal") {
			return nil
		}

		outPath := filepath.Join(out, dir, filename)

		name := strings.TrimSuffix(filename, filepath.Ext(filename))
		if filename == "_index.md" {
			if dir != "" {
				name = dir
			} else {
				name = "index"
			}
		}

		if err := os.MkdirAll(filepath.Dir(outPath), os.ModePerm); err != nil {
			return err
		}

		f, err := os.Create(outPath)
		if err != nil {
			return err
		}
		defer f.Close()

		fm := fmt.Sprintf(fmTmpl, name, filepath.Join(urlPrefix, dir, name), time.Now())
		f.WriteString(fm)

		srcFile, err := os.Open(path)
		if err != nil {
			return err
		}
		defer srcFile.Close()

		io.Copy(f, srcFile)

		return nil
	}); err != nil {
		return err
	}

	return nil
}
