import React, { useState } from "react";
import {
  Box,
  Flex,
  Input,
  Text,
  Center,
  Button,
  Textarea,
  Select,
  ModalOverlay,
  Modal,
  ModalContent,
  useDisclosure,
} from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";

export default function AddBook() {
  const [addBookFlag, setAddBookFlag] = useState(true);
  const [searchBookFlag, setSearchBookFlag] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const switchAdder = () => {
    addBookFlag ? setAddBookFlag(false) : setAddBookFlag(true);
  };

  const switchSearch = () => {
    addBookFlag ? setSearchBookFlag(false) : setSearchBookFlag(true);
  };

  return (
    <>
      <Button onClick={onOpen}>Open Modal</Button>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <Center>
            <Flex
              w="90%"
              border="1px"
              borderColor="black"
              borderRadius="md"
              m={4}
              style={{ flexDirection: "column" }}
            >
              <Button
                w="40px"
                h="40px"
                m={2}
                rounded={100}
                alignSelf="flex-end"
              >
                <CloseIcon />
              </Button>
              <Center m={4}>
                <Flex w="100%" style={{ flexDirection: "column" }}>
                  {addBookFlag ? (
                    <>
                      <Text>поиск книги</Text>
                      <Input placeholder="введите название" />
                      <Box
                        w="100%"
                        minH={20}
                        mt={4}
                        border="1px"
                        borderColor="black"
                        borderRadius="md"
                      ></Box>
                      <Flex
                        w="30%"
                        mt={5}
                        style={{
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Text>Не нашли подходящую книгу?</Text>
                        <Button onClick={switchAdder}>Добавить свою</Button>
                      </Flex>
                    </>
                  ) : (
                    <>
                      <Box w="100%" minH={20} mt={4}>
                        <Button onClick={switchAdder} mb={4}>
                          Вернуться к поиску
                        </Button>
                        <Input mb={4} placeholder="название" />
                        <Input mb={4} placeholder="автор" />
                        <Select mb={4} placeholder="жанр"></Select>
                        <Input mb={4} placeholder="год" />
                        <Input mb={4} placeholder="URL обложки" />
                      </Box>
                    </>
                  )}

                  <Flex style={{ justifyContent: "space-between" }}>
                    <Flex
                      w="50%"
                      mt={4}
                      style={{
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      <Textarea
                        w="100%"
                        minH={20}
                        border="1px"
                        borderColor="black"
                        borderRadius="md"
                        placeholder="добавьте рецензию"
                      ></Textarea>
                      <Box mt={10}>RATING STARS</Box>
                    </Flex>
                    <Flex
                      w="50%"
                      minH={20}
                      mt={4}
                      style={{
                        flexDirection: "column",
                        justifyContent: "flex-end",
                        alignItems: "flex-end",
                      }}
                    >
                      <Button>Добавить рецензию</Button>
                    </Flex>
                  </Flex>
                </Flex>
              </Center>
            </Flex>
          </Center>
        </ModalContent>
      </Modal>
    </>
  );
}
