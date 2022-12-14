import sys
import shutil
import os
import zipfile
import subprocess

script_dir = os.path.dirname(os.path.realpath(__file__))
encryptor_path = os.path.join(script_dir, "encryptor")


if __name__ == "__main__":
    # Get request info
    temp_file = sys.argv[1]
    student_id = sys.argv[2]
    extension = sys.argv[3]
    cutoff = sys.argv[4]
    vba_password = sys.argv[5]
    encrypt = True if int(sys.argv[6]) == 1 else False
    password = sys.argv[7] if len(sys.argv) == 8 else ""

    # Create /out folder if not exists
    if not os.path.exists("./data/out"):
        os.mkdir("./data/out", 0o777)

    # Create /tmp folder if not exists
    if not os.path.exists("./data/tmp"):
        os.mkdir("./data/tmp", 0o777)

    # Create /out/unzipped folder if not exists
    if not os.path.exists("./data/out/unzipped"):
        os.mkdir("./data/out/unzipped", 0o777)

    # If template hasn't been unzipped before, unzip it
    if not os.path.exists(
        "./data/out/unzipped/{}_template_{}".format(temp_file, extension)
    ):
        with zipfile.ZipFile(
            "./data/templates/{}_template.{}".format(temp_file, extension), "r"
        ) as zip_ref:
            zip_ref.extractall(
                "./data/out/unzipped/{}_template_{}".format(temp_file, extension)
            )

    # Create temporary directory for new file
    shutil.copytree(
        "./data/out/unzipped/{}_template_{}".format(temp_file, extension),
        "./data/tmp/{}_{}".format(student_id, extension),
    )

    # Change Student ID and add cutoff date
    with open(
        "./data/tmp/{}_{}/xl/sharedStrings.xml".format(student_id, extension), "r"
    ) as fp:
        raw = fp.read()
        raw = raw.replace("S000001", student_id)
        raw = raw.replace("#UNIX", cutoff)
        raw = raw.replace("#PASS", vba_password)

    with open(
        "./data/tmp/{}_{}/xl/sharedStrings.xml".format(student_id, extension), "w"
    ) as fp:
        fp.write(raw)

    # Comprsess the folder and place it in /out
    with zipfile.ZipFile(
        "./data/out/{}_{}.{}".format(student_id, temp_file, extension),
        "w",
        zipfile.ZIP_DEFLATED,
    ) as zipobj:
        rootlen = len("./data/tmp/{}_{}".format(student_id, extension)) + 1
        for base, _, files in os.walk("./data/tmp/{}_{}".format(student_id, extension)):
            for file in files:
                fn = os.path.join(base, file)
                zipobj.write(fn, fn[rootlen:])

    # Remove temporary directory
    shutil.rmtree("./data/tmp/{}_{}".format(student_id, extension))

    if encrypt:
        # Encrypt the file
        subprocess.check_output(
            [
                encryptor_path,
                "-e",
                "-p",
                password,
                os.path.abspath(
                    "./data/out/{}_{}.{}".format(student_id, temp_file, extension)
                ),
                os.path.abspath(
                    "./data/out/{}_{}_enc.{}".format(student_id, temp_file, extension)
                ),
            ]
        )

        os.remove("./data/out/{}_{}.{}".format(student_id, temp_file, extension))
